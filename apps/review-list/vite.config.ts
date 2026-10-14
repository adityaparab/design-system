/// <reference types="vitest/config" />
import { federation } from '@module-federation/vite';
import { apiProxy, buildDefines, PORTS, sharedDependencies } from '@verity/build-config';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'reviewList',
      filename: 'remoteEntry.js',
      exposes: { './ReviewList': './src/expose/ReviewList.tsx' },
      shared: sharedDependencies(['react', 'react-dom', '@verity/design-system', '@tanstack/react-query', 'date-fns'], {
        // Shared by range, not as a singleton: doc-viewer still runs date-fns 3,
        // and both majors coexist in the share scope.
        'date-fns': { requiredVersion: '^4.0.0' },
      }),
      dts: false,
      manifest: true,
    }),
  ],
  define: buildDefines(),
  server: { port: PORTS.reviewList, strictPort: true, origin: `http://localhost:${PORTS.reviewList}`, proxy: apiProxy() },
  preview: { port: PORTS.reviewList, strictPort: true, proxy: apiProxy(), cors: true },
  build: { target: 'esnext' },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'] },
});
