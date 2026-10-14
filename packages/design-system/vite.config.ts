import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

// Library build: ESM only, React/PrimeReact left to the consumer's bundler (or the
// Module Federation share scope), all component CSS extracted to one stylesheet.
export default defineConfig({
  plugins: [react()],
  define: { __DS_VERSION__: JSON.stringify(pkg.version) },
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/, /^primereact(\/.*)?$/],
    },
    sourcemap: true,
  },
});
