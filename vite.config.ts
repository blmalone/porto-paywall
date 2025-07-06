/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mkcert()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  server: {
    host: true, // This allows access from other devices on your network
    proxy: {
      '/api': {
        target: process.env.PRODUCTION_VITE_API_URL || 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  }
})
