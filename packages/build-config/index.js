// Plain JS so Vite configs can import it without a build step.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PORTS = { shell: 5173, reviewList: 5174, docViewer: 5175, api: 5180 };

/**
 * The share policy is owned by the platform team, not by each remote:
 * - React and the design system are singletons (one copy, one context, one stylesheet).
 * - strictVersion on React turns a major mismatch into a load error the shell can
 *   isolate, instead of a subtle "invalid hook call" at runtime.
 * - Everything else is shared by semver range, so different majors can coexist.
 */
const POLICY = {
  react: { singleton: true, requiredVersion: '^19.0.0', strictVersion: true },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0', strictVersion: true },
  '@verity/design-system': { singleton: true, requiredVersion: '^1.0.0' },
  '@tanstack/react-query': { requiredVersion: '^5.0.0' },
};

export function sharedDependencies(names, overrides = {}) {
  const shared = {};
  for (const name of names) {
    const config = overrides[name] ?? POLICY[name];
    if (!config) throw new Error(`No share policy for "${name}"; pass it in overrides.`);
    shared[name] = config;
  }
  return shared;
}

export function apiProxy() {
  return { '/api': { target: `http://localhost:${PORTS.api}`, changeOrigin: true } };
}

const designSystemPackage = fileURLToPath(new URL('../design-system/package.json', import.meta.url));

/** Build-time constants every remote reports to the shell's platform inspector. */
export function buildDefines() {
  const dsVersion = JSON.parse(readFileSync(designSystemPackage, 'utf8')).version;
  let buildId = process.env.BUILD_ID;
  if (!buildId) {
    try {
      buildId = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
      buildId = 'local';
    }
  }
  return {
    __DS_VERSION__: JSON.stringify(dsVersion),
    __BUILD_ID__: JSON.stringify(`${buildId}-${new Date().toISOString().slice(0, 16)}`),
  };
}
