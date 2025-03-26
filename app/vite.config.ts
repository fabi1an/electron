//@ts-check
import path from 'node:path'

import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [],
  build: {
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1024,
    ssr: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
    },
    rollupOptions: {
      input: path.resolve(__dirname, 'src/preload.ts'),
      output: { minifyInternalExports: true },
    },
  },
})
