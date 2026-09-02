import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sites } from '@openai/sites-vite-plugin'
import { copyFile, mkdir } from 'node:fs/promises'

const sitesWorker = () => ({
  name: 'sites-worker-entry',
  async closeBundle() {
    await mkdir('dist/server', { recursive: true })
    await copyFile('worker/index.js', 'dist/server/index.js')
  },
})

export default defineConfig({
  plugins: [react(), sites(), sitesWorker()],
  build: { outDir: 'dist/client', emptyOutDir: true },
})
