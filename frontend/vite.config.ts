import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/electrical-competency-assessment/',
  server: { host: '0.0.0.0', port: 5173 },
});
