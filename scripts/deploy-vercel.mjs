#!/usr/bin/env node
/**
 * Static (backend-less) deploy of the platform to Vercel: one project per app.
 *
 *   pnpm deploy:vercel                 # remotes first, then the shell
 *   pnpm deploy:vercel doc-viewer      # ship one remote on its own; the shell is untouched
 *
 * Every app is built with VITE_API_MODE=browser, so the review API runs in the
 * visitor's tab (@verity/review-api/browser). The shell's remotes.json is written
 * from the remotes' production URLs at build time.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

const VERCEL_CLI = 'vercel@64.1.0';

const APPS = {
  'review-list': { pkg: '@verity/review-list', project: 'verity-review-list', env: 'REVIEW_LIST_URL' },
  'doc-viewer': { pkg: '@verity/doc-viewer', project: 'verity-doc-viewer', env: 'DOC_VIEWER_URL' },
  shell: { pkg: '@verity/shell', project: 'verity-review' },
};

const productionUrl = (project) => `https://${project}.vercel.app`;

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
  console.log(`▶ deploy ${name} -> ${APPS[name].project}`);
  const out = run('npx', ['--yes', VERCEL_CLI, 'deploy', '--prod', '--yes', '--project', APPS[name].project], { cwd: dist });
  const result = JSON.parse(out.slice(out.indexOf('{')));
  if (result.status !== 'ok') throw new Error(`${name}: ${result.message ?? out}`);
  console.log(`  ✓ ${result.deployment.productionUrl}  (${result.deployment.url})`);
  return result.deployment.productionUrl;
}

const requested = process.argv.slice(2);
const targets = requested.length ? requested : ['review-list', 'doc-viewer', 'shell'];
for (const t of targets) if (!APPS[t]) throw new Error(`Unknown app "${t}". Use: ${Object.keys(APPS).join(', ')}`);

console.log('▶ build shared packages');
run('pnpm', ['turbo', 'run', 'build', '--filter=./packages/*'], { stdio: 'inherit' });

const remoteUrls = {
  REVIEW_LIST_URL: process.env.REVIEW_LIST_URL ?? productionUrl(APPS['review-list'].project),
  DOC_VIEWER_URL: process.env.DOC_VIEWER_URL ?? productionUrl(APPS['doc-viewer'].project),
};

for (const name of targets.filter((t) => t !== 'shell')) {
  build(name);
  remoteUrls[APPS[name].env] = deploy(name);
}

if (targets.includes('shell')) {
  build('shell', remoteUrls);
  const url = deploy('shell');
  console.log(`\nLive: ${url}\n  review-list: ${remoteUrls.REVIEW_LIST_URL}\n  doc-viewer:  ${remoteUrls.DOC_VIEWER_URL}`);
}
