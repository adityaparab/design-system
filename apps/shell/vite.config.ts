/// <reference types="vitest/config" />
import { federation } from '@module-federation/vite';
import { apiProxy, PORTS, sharedDependencies } from '@verity/build-config';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Writes dist/remotes.json from REVIEW_LIST_URL / DOC_VIEWER_URL when they are set,
 * so each environment points at its own remotes without a code change.
 */
function remotesManifest(): Plugin {
  let outDir = 'dist';
  return {
    name: 'verity-remotes-manifest',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const { REVIEW_LIST_URL, DOC_VIEWER_URL } = process.env;
      if (!REVIEW_LIST_URL || !DOC_VIEWER_URL) return;
      const entry = (base: string) => `${base.replace(/\/$/, '')}/remoteEntry.js`;
      const manifest = { reviewList: { entry: entry(REVIEW_LIST_URL) }, docViewer: { entry: entry(DOC_VIEWER_URL) } };
      writeFileSync(resolve(outDir, 'remotes.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    remotesManifest(),
    federation({
      name: 'shell',
      // Remotes are registered at runtime from /remotes.json, so a remote can be
      // rolled forward or back without rebuilding the shell.
      remotes: {},
      shared: sharedDependencies(['react', 'react-dom', '@verity/design-system']),
      dts: false,
    }),
  ],
  server: { port: PORTS.shell, strictPort: true, origin: `http://localhost:${PORTS.shell}`, proxy: apiProxy() },
  preview: { port: PORTS.shell, strictPort: true, proxy: apiProxy() },
  build: { target: 'esnext' },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'] },
});
