import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import path from 'node:path';

export default defineConfig({
  base: '/project_test/',
  plugins: [
    react(),
    legacy({ targets: ['defaults', 'not IE 11'], modernPolyfills: true }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
