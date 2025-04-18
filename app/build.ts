import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Parcel } from '@parcel/core'
import { type InitialParcelOptions } from '@parcel/types'

import dotenv from 'dotenv'
import * as electron from 'electron-builder'
import electronConfig from './electron.config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const env = dotenv.config({ path: path.join(__dirname, '..', '.env') })

const distDir = path.join(__dirname, 'dist')
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, {
    recursive: true,
    force: true,
  })
}

function defineConfig<T extends InitialParcelOptions>(options: T) {
  return {
    cacheDir: path.join(distDir, '.parcel-cache'),
    shouldDisableCache: true,
    defaultConfig: './parcel.config.json',
    mode: 'production',
    defaultTargetOptions: {
      distDir,
      sourceMaps: false,
      shouldOptimize: false,
      shouldScopeHoist: true,
      outputFormat: 'commonjs',
    },
    additionalReporters: [
      {
        packageName: '@parcel/reporter-cli',
        resolveFrom: __filename,
      },
    ],
    env: {
      NODE_ENV: 'production',
      ...env.parsed,
    },
    ...options,
  } satisfies InitialParcelOptions
}

async function buildElectron() {
  const pkg = JSON.parse(
    await fs.promises.readFile(path.join(__dirname, 'package.json'), 'utf-8'),
  )

  delete pkg.scripts
  delete pkg.dependencies
  delete pkg.devDependencies
  pkg.type = 'commonjs'
  pkg.main = './index.js'

  await fs.promises.writeFile(
    path.join(distDir, 'package.json'),
    JSON.stringify(pkg, null, 2),
    'utf-8',
  )

  await electron.build({
    config: {
      ...electronConfig,
      directories: { app: distDir, output: path.join(distDir, 'electron') },
      files: ['**\/*', '!**\/electron\/**\/*', '!**\/.parcel-cache\/*'],
      extends: null,
    },
  })
}

async function build(watch = false) {
  const configs = [
    defineConfig({
      entries: `src/index.ts`,
      targets: {
        electron: {
          context: 'electron-main',
          includeNodeModules: true,
          distDir,
        },
      },
    }),
    defineConfig({
      entries: `src/preload.ts`,
      targets: {
        preload: {
          context: 'node',
          distDir,
        },
      },
    }),
    defineConfig({
      entries: `public/*.html`,
      targets: {
        renderer: {
          context: 'browser',
          distDir: path.join(distDir, 'public'),
          publicUrl: '.',
          engines: {
            browsers: 'chrome 87',
          },
        },
      },
    }),
  ] as const

  if (watch) {
    const bundler = new Parcel(configs[2])
    await bundler.watch()
  } else {
    for (const config of configs) {
      const bundler = new Parcel(config)
      await bundler.run()
    }

    await buildElectron()
  }
}

build()
