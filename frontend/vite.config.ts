import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['cuter-lue-untrying.ngrok-free.dev'],
    proxy: {
      '/auth': { target: 'https://4znrrmbr-3000.asse.devtunnels.ms', changeOrigin: true },
      '/vehicles': { target: 'https://4znrrmbr-3000.asse.devtunnels.ms', changeOrigin: true },
      '/telemetry': { target: 'https://4znrrmbr-3000.asse.devtunnels.ms', changeOrigin: true },
      '/routes': { target: 'https://4znrrmbr-3000.asse.devtunnels.ms', changeOrigin: true },
      '/alerts': { target: 'https://4znrrmbr-3000.asse.devtunnels.ms', changeOrigin: true },
      '/analytics': { target: 'https://4znrrmbr-3000.asse.devtunnels.ms', changeOrigin: true },
      '/health': { target: 'https://4znrrmbr-3000.asse.devtunnels.ms', changeOrigin: true },
    },
  },
  envPrefix: 'VITE_',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps'
            if (id.includes('recharts')) return 'charts'
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor'
          }
        },
      },
    },
  },
})
