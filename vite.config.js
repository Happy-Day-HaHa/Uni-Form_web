import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sites } from '@openai/sites-vite-plugin'
import { copyFile, cp, mkdir, readdir } from 'node:fs/promises'

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

    // Cloudflare Pages' configured output directory is "dist", not "dist/client",
    // so mirror the client build up a level. Keeps SPA fallback (_redirects) and
    // static assets resolvable regardless of which directory Cloudflare actually reads.
    const clientEntries = await readdir('dist/client')
    await Promise.all(clientEntries.map((entry) => cp(`dist/client/${entry}`, `dist/${entry}`, { recursive: true })))
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
