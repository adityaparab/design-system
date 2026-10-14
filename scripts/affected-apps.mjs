#!/usr/bin/env node
/**
 * Prints the deployable apps (apps/* with a vercel.json) that Turborepo considers
 * affected since TURBO_SCM_BASE: their own files changed, or a workspace package
 * they depend on (design system, contracts, review API, build preset) did.
 *
 *   TURBO_SCM_BASE=origin/main node scripts/affected-apps.mjs   # e.g. "doc-viewer"
 *
 * Without TURBO_SCM_BASE every deployable app is printed (first deploy, or a manual
 * full redeploy). The CI deploy job passes the output to scripts/deploy-vercel.mjs.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const deployable = readdirSync('apps').filter((name) => existsSync(`apps/${name}/vercel.json`));
const base = process.env.TURBO_SCM_BASE;

let apps = deployable;
if (base) {
  const out = execFileSync('pnpm', ['exec', 'turbo', 'ls', '--affected', '--output=json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const { packages } = JSON.parse(out.slice(out.indexOf('{')));
  const affected = new Set(packages.items.map((pkg) => pkg.path));
  apps = deployable.filter((name) => affected.has(`apps/${name}`));
  console.error(`Affected since ${base.slice(0, 12)}: ${packages.items.map((pkg) => pkg.name).join(', ') || 'nothing'}`);
}
console.error(`Apps to deploy: ${apps.join(', ') || 'none'}`);
console.log(apps.join(' '));
