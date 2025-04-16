//@ts-check
import path from 'node:path'

import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

import commonjs from 'vite-plugin-commonjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const removeNodePrefix: Plugin = {
  apply: 'build',
  enforce: 'post',
  name: 'remove-node-prefix',
  transform: {
    order: 'post',
    handler: code => code.replace(/node:/g, ''),
  },
}

export default defineConfig({
  appType: 'custom',
  plugins: [commonjs(), removeNodePrefix],
  build: {
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1024,
    ssr: true,
    target: 'node12',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [/^node:.*$/, 'nw-flash-trust'],
      input: path.resolve(__dirname, 'src/preload.ts'),
      treeshake: true,
      output: {
        format: 'cjs',
      },
    },
  },
  esbuild: {
    platform: 'node',
    target: 'node12',
  },
})
