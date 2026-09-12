import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sites } from '@openai/sites-vite-plugin'
import { copyFile, mkdir } from 'node:fs/promises'

const sitesWorker = () => ({
  name: 'sites-worker-entry',
  async closeBundle() {
    await mkdir('dist/server', { recursive: true })
    await copyFile('worker/index.js', 'dist/server/index.js')
    await Promise.all([
      'index-DVgNhPL7.js',
      'index-DLJjvkwI.js',
      'index-DqN-FbAy.js',
    ].map((file) => copyFile('dist/client/assets/index.js', `dist/client/assets/${file}`)))
    await Promise.all([
      'index-BNJJcRh4.css',
      'index-T0hXYRDC.css',
      'index-B1lMb0OH.css',
    ].map((file) => copyFile('dist/client/assets/index.css', `dist/client/assets/${file}`)))
  },
})

export default defineConfig({
  plugins: [react(), sites(), sitesWorker()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => assetInfo.names?.some((name) => name.endsWith('.css')) ? 'assets/index.css' : 'assets/[name][extname]',
      },
    },
  },
})
