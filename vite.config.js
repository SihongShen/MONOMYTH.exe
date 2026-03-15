import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: '/'              → Vercel deployment (default)
// base: '/MONOMYTH.exe/' → GitHub Pages (set env var VITE_BASE_URL=/MONOMYTH.exe/ at build time)
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL || '/',
  server: {
    // Proxy /api/* to the local Vercel dev server — use `vercel dev` instead of `npm run dev`
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
