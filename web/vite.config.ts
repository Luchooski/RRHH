import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path';

export default defineConfig({
  plugins: [react(),tailwindcss()],
  envDir: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true, 
    port: 5173,
  
    strictPort: true,  
    hmr: {
      host: 'localhost',
      port: 5173,       
      protocol: 'ws',    
    },
  },
});
