/// <reference types="vitest/config" />
import { federation } from '@module-federation/vite';
import { apiProxy, buildDefines, PORTS, sharedDependencies } from '@verity/build-config';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'docViewer',
      filename: 'remoteEntry.js',
      exposes: { './DocViewer': './src/expose/DocViewer.tsx' },
      shared: sharedDependencies(['react', 'react-dom', '@verity/design-system', '@tanstack/react-query', 'date-fns'], {
        // Deliberately one major behind review-list: the share scope keeps both.
        'date-fns': { requiredVersion: '^3.0.0' },
      }),
      dts: false,
      manifest: true,
    }),
  ],
  define: buildDefines(),
  server: { port: PORTS.docViewer, strictPort: true, origin: `http://localhost:${PORTS.docViewer}`, proxy: apiProxy() },
  preview: { port: PORTS.docViewer, strictPort: true, proxy: apiProxy(), cors: true },
  build: { target: 'esnext' },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'] },
});
