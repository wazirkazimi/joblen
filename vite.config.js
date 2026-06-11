import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Dynamically generate clean ESM wrappers for all es-toolkit/compat modules at startup.
// This resolves the CommonJS/ESM interop name-shadowing bug in Vite 8 + Rolldown.
const compatDir = path.resolve(process.cwd(), 'node_modules/es-toolkit/dist/compat')
const wrapperDir = path.resolve(process.cwd(), 'src/lib/es-toolkit-compat')

if (!fs.existsSync(wrapperDir)) {
  fs.mkdirSync(wrapperDir, { recursive: true })
}

try {
  const categories = ['array', 'function', 'math', 'object', 'predicate', 'string', 'util']
  for (const category of categories) {
    const categoryPath = path.join(compatDir, category)
    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath)
      for (const file of files) {
        if (file.endsWith('.mjs')) {
          const name = path.basename(file, '.mjs')
          const wrapperPath = path.join(wrapperDir, `${name}.js`)
          const content = `export { ${name} as default } from '../../../node_modules/es-toolkit/dist/compat/index.mjs';\n`
          
          if (!fs.existsSync(wrapperPath) || fs.readFileSync(wrapperPath, 'utf8') !== content) {
            fs.writeFileSync(wrapperPath, content, 'utf8')
          }
        }
      }
    }
  }
  
  // Write index.js to support importing from 'es-toolkit/compat' directly
  const indexPath = path.join(wrapperDir, 'index.js')
  const indexContent = `export * from '../../../node_modules/es-toolkit/dist/compat/index.mjs';\n`
  if (!fs.existsSync(indexPath) || fs.readFileSync(indexPath, 'utf8') !== indexContent) {
    fs.writeFileSync(indexPath, indexContent, 'utf8')
  }
} catch (err) {
  console.error('Failed to generate es-toolkit compat wrappers:', err)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'es-toolkit/compat': path.resolve(process.cwd(), './src/lib/es-toolkit-compat')
    }
  }
})



