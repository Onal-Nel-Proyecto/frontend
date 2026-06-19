import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Separar CSS de terceros en chunks más pequeños
    cssCodeSplit: true,
    // Advertencia de tamaño de chunk (por defecto 500kB)
    chunkSizeWarningLimit: 600,
  },

  server: {
    proxy: {
      // Proxy para el backend en desarrollo — evita CORS
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
