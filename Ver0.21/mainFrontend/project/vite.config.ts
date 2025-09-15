import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    fs: {
      allow: ['..']
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    mimeTypes: {
      'application/wasm': ['wasm']
    }
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    rollupOptions: {
      external: [],
    },
    assetsInlineLimit: 0, // Don't inline WASM files
  },
  define: {
    global: 'globalThis',
  },
  worker: {
    format: 'es'
  }
});