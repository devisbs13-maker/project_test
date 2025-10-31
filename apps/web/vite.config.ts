import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// In GitHub Actions we expose GH_PAGES=true. When true, compute base from repo name.
const repo = process.env.GITHUB_REPOSITORY?.split('/')?.[1] || '';
const isGhPages = process.env.GH_PAGES === 'true';
const base = isGhPages && repo ? `/${repo}/` : '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
