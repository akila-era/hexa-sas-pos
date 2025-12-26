import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3006,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:5557',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});





