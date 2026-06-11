import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'es-toolkit/compat/get': path.resolve(process.cwd(), './src/lib/get.js'),
      'es-toolkit/compat/uniqBy': path.resolve(process.cwd(), './src/lib/uniqBy.js')
    }
  }
})



