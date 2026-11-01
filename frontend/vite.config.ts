import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Keep development API requests on localhost:5173.
    proxy: {
      '/api': 'http://127.0.0.1:8082',
      '/auth': 'http://127.0.0.1:8082',
      '/health': 'http://127.0.0.1:8082',
    },
  },
})
