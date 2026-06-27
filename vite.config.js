import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Subtext is a fully client-side app — no backend, no env, no secrets.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 },
})
