import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mkcert()
  ],
  server: {
    host: true, // This allows access from other devices on your network
    proxy: {
      '/api': {
        target: process.env.PRODUCTION_VITE_API_URL || 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('Proxying request:', req.method, req.url)
          })
        }
      },
      '/siwe': {
        target: process.env.PRODUCTION_VITE_API_URL || 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
      '/siwe/nonce': {
        target: process.env.PRODUCTION_VITE_API_URL || 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
      '/logout': {
        target: process.env.PRODUCTION_VITE_API_URL || 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      }
    },
  }
})
