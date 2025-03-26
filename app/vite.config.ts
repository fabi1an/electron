import fs from 'node:fs'
//@ts-check
import path from 'node:path'

import { fileURLToPath } from 'node:url'
import v8 from 'node:v8'
import bytenodeCore from 'bytenode'
import { defineConfig, type Plugin } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

v8.setFlagsFromString('--no-lazy')
export default defineConfig({
  plugins: [byteCode()],
  build: {
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1024,
    ssr: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['bytenode'],
      input: path.resolve(__dirname, 'src/preload.ts'),
      output: { minifyInternalExports: true },
    },
  },
})

function byteCode(): Plugin {
  return {
    apply: 'build',
    name: 'vite-bytecode',
    writeBundle: {
      order: 'post',
      async handler(opts, bundle) {
        if (!opts.dir) return
        for (const file of Object.keys(bundle)) {
          const { ext, name } = path.parse(file)
          const targetFile = path.resolve(path.join(opts.dir, file))
          const compileAsModule = ext.toLowerCase() === '.cjs'
          if (compileAsModule) {
            bytenodeCore.compileFile({
              compileAsModule,
              electron: false,
              filename: targetFile,
            })

            fs.writeFileSync(
              targetFile,
              `require("bytenode");\nrequire("./${name}.jsc");`,
            )
          }
        }
      },
    },
  }
}
