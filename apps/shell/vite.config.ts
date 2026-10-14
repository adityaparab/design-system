/// <reference types="vitest/config" />
import { federation } from '@module-federation/vite';
import { apiProxy, PORTS, sharedDependencies } from '@verity/build-config';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
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
