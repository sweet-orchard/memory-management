import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Use root base in dev; keep GitHub Pages base in production builds.
  base: mode === 'production' ? '/memory-management/' : '/',
}))
