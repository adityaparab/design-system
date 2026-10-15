#!/usr/bin/env node
/**
 * Static (backend-less) deploy of the platform to Vercel: one project per app.
 *
 *   pnpm deploy:vercel                       # remotes first, then the shell
 *   pnpm deploy:vercel doc-viewer            # ship one remote on its own; the shell is untouched
 *   pnpm deploy:vercel --preview doc-viewer  # preview deploy: the viewer plus a shell that loads it
 *
 * Every app is built with VITE_API_MODE=browser, so the review API runs in the
 * visitor's tab (@verity/review-api/browser). The shell's remotes.json is written
 * from the remotes' URLs at build time: production aliases, or in --preview mode the
 * preview URLs of the remotes deployed in this run (production for the rest).
 *
 * CI (.github/workflows/ci.yml) runs this with the apps scripts/affected-apps.mjs
 * reports, authenticated by VERCEL_TOKEN.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const VERCEL_CLI = 'vercel@64.1.0';
const VERCEL_SCOPE = process.env.VERCEL_SCOPE ?? 'personal-2bdc';

const APPS = {
  'review-list': { pkg: '@verity/review-list', project: 'verity-review-list', env: 'REVIEW_LIST_URL' },
  'doc-viewer': { pkg: '@verity/doc-viewer', project: 'verity-doc-viewer', env: 'DOC_VIEWER_URL' },
  // The shell's public URL is a custom domain on its Vercel project; remotes use their *.vercel.app aliases.
  shell: { pkg: '@verity/shell', project: 'verity-review', domain: 'design.adityaparab.dev' },
};

const productionUrl = (name) => `https://${APPS[name].domain ?? `${APPS[name].project}.vercel.app`}`;

const argv = process.argv.slice(2);
const preview = argv.includes('--preview');
const deployed = [];

function run(cmd, args, options = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...options });
}

function build(name, extraEnv = {}) {
  console.log(`\n▶ build ${name}`);
  run('pnpm', ['--filter', APPS[name].pkg, 'build'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_API_MODE: 'browser', ...extraEnv },
  });
}

function deploy(name) {
  const dist = join('apps', name, 'dist');
  copyFileSync(join('apps', name, 'vercel.json'), join(dist, 'vercel.json'));
  console.log(`▶ deploy ${name} -> ${APPS[name].project}${preview ? ' (preview)' : ''}`);
  // --non-interactive makes the CLI print the JSON result parsed below (it only does so
  // by default when it detects an AI agent). The token comes from VERCEL_TOKEN in CI.
  const cliArgs = ['--yes', VERCEL_CLI, 'deploy', '--yes', '--non-interactive', '--scope', VERCEL_SCOPE, '--project', APPS[name].project];
  if (!preview) cliArgs.push('--prod');
  const out = run('npx', cliArgs, { cwd: dist });
  const result = JSON.parse(out.slice(out.indexOf('{')));
  if (result.status !== 'ok') throw new Error(`${name}: ${result.message ?? out}`);
  const url = preview ? result.deployment.url : productionUrl(name);
  console.log(`  ✓ ${url}  (${result.deployment.url})`);
  deployed.push({ name, url });
  return url;
}

const requested = argv.filter((a) => a !== '--preview');
const targets = requested.length ? requested : ['review-list', 'doc-viewer', 'shell'];
for (const t of targets) if (!APPS[t]) throw new Error(`Unknown app "${t}". Use: ${Object.keys(APPS).join(', ')}`);
// A preview is only useful composed, so a remote-only change still gets a shell that loads it.
if (preview && !targets.includes('shell')) targets.push('shell');

console.log('▶ build shared packages');
run('pnpm', ['turbo', 'run', 'build', '--filter=./packages/*'], { stdio: 'inherit' });

const remoteUrls = {
  REVIEW_LIST_URL: process.env.REVIEW_LIST_URL ?? productionUrl('review-list'),
  DOC_VIEWER_URL: process.env.DOC_VIEWER_URL ?? productionUrl('doc-viewer'),
};

for (const name of targets.filter((t) => t !== 'shell')) {
  build(name);
  remoteUrls[APPS[name].env] = deploy(name);
}

let shellUrl = productionUrl('shell');
if (targets.includes('shell')) {
  build('shell', remoteUrls);
  shellUrl = deploy('shell');
}
console.log(`\n${preview ? 'Preview' : 'Live'}: ${shellUrl}\n  review-list: ${remoteUrls.REVIEW_LIST_URL}\n  doc-viewer:  ${remoteUrls.DOC_VIEWER_URL}`);

// In GitHub Actions: the shell URL becomes the environment URL, and the job summary lists what shipped.
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `url=${shellUrl}\n`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = Object.keys(APPS).map((name) => {
    const hit = deployed.find((d) => d.name === name);
    const result = hit ? `deployed: ${hit.url}` : preview ? 'unchanged (preview uses production)' : 'unchanged';
    return `| ${name} | \`${APPS[name].project}\` | ${result} |`;
  });
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [`### ${preview ? 'Preview' : 'Production'} deploy`, '', `Open: ${shellUrl}`, '', '| App | Vercel project | Result |', '| --- | --- | --- |', ...rows, ''].join('\n'),
  );
}
