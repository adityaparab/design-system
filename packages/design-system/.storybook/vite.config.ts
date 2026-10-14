import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from '../package.json' with { type: 'json' };

export default defineConfig({
  plugins: [react()],
  define: { __DS_VERSION__: JSON.stringify(pkg.version) },
});
