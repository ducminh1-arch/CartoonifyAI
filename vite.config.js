import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    hmr: {
      overlay: false
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  }
});
