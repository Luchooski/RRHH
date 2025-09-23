import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    host: true,        // escucha en 0.0.0.0 (necesario en algunas setups de Windows/WSL)
    port: 5173,
    strictPort: true,  // si 5173 está ocupado, falla en vez de cambiar de puerto (útil para depurar)
    hmr: {
      host: 'localhost', // fuerza el host que usa el cliente HMR
      port: 5173,        // idem para el puerto del WebSocket
      protocol: 'ws',    // si sirvieras por https, cambia a 'wss'
    },
  },
});
