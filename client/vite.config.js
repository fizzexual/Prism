import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // For GitHub Pages the app is served under /<repo>/ — set via BUILD_BASE in CI.
  base: process.env.BUILD_BASE || '/',
  plugins: [react()],
  // Ensure a single React instance across the app and pre-bundled deps
  // (dnd-kit, @react-three/fiber) so hooks bind correctly in this monorepo.
  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/api': 'http://localhost:9998',
      '/uploads': 'http://localhost:9998',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
});
