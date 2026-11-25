import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Our local catalogue API (npm run api → :4000)
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/astro-api': {
        target: 'https://myastrosutra.online',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/astro-api/, '/api'),
      },
    },
  },
})
