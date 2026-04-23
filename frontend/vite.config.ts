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
      '/auth': { target: 'http://localhost:3000', changeOrigin: true },
      '/vehicles': { target: 'http://localhost:3000', changeOrigin: true },
      '/telemetry': { target: 'http://localhost:3000', changeOrigin: true },
      '/routes': { target: 'http://localhost:3000', changeOrigin: true },
      '/alerts': { target: 'http://localhost:3000', changeOrigin: true },
      '/analytics': { target: 'http://localhost:3000', changeOrigin: true },
      '/health': { target: 'http://localhost:3000', changeOrigin: true },
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
