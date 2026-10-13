import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy API calls to the backend so CORS is never an issue in dev
    proxy: {
      '/health': 'http://localhost:3001',
      '/config':  'http://localhost:3001',
      '/quote':   'http://localhost:3001',
      '/series':  'http://localhost:3001',
      '/report':  'http://localhost:3001',
      '/weather': 'http://localhost:3001',
      '/news':    'http://localhost:3001',
      '/overview': 'http://localhost:3001',
      '/brief':   'http://localhost:3001',
    },
  },
});
