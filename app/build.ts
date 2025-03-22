import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import url from 'node:url'
import { deepmerge } from 'deepmerge-ts'
import * as electron from 'electron-builder'
import * as vite from 'vite'
import electronConfig from './electron.config'
import viteConfig from './vite.config'

const dirname = path.dirname(url.fileURLToPath(import.meta.url))
const paths = ['build', 'bundled'].map(x => path.join(dirname, 'dist', x))
const entry = {
  main:
    typeof viteConfig.build?.lib === 'object'
    && typeof viteConfig.build?.lib.entry === 'string'
    && viteConfig.build?.lib.entry,
} as const

async function run() {
  cleanup()

  await vite.build(
    deepmerge(viteConfig, {
      build: {
        outDir: paths[0],
        lib: {
          ...(entry.main && {
            entry: { main: entry.main },
          }),
        },
      },
    } as vite.UserConfig),
  )

  await copyPackageJson()

  // Parallelize symlink creation
  await Promise.all([
    fs.promises
      .symlink(
        path.join(process.cwd(), electronConfig.directories.buildResources),
        path.join(paths[0], electronConfig.directories.buildResources),
      )
      .catch(() => null),
  ])

  await electron.build({
    config: deepmerge(electronConfig, {
      directories: {
        output: paths[1],
        app: paths[0],
      },
      files: ['**/*'],
      extends: null,
    } as electron.Configuration),
  })
}

function cleanup() {
  // Only clean build and bundled directories
  for (const _ of paths) {
    fs.rmSync(_, { recursive: true, force: true })
    fs.mkdirSync(_, { recursive: true })
  }
}

async function copyPackageJson() {
  const packageJsonText = await fs.promises.readFile(
    path.join(dirname, 'package.json'),
    { encoding: 'utf-8' },
  )

  const packageJson = JSON.parse(packageJsonText)
  const keys = [
    'name',
    'version',
    'description',
    'author',
    'homepage',
    'repository',
    'license',
  ]
  const modifiedPackageJson: Record<string, any> = {}
  for (const key of keys) {
    modifiedPackageJson[key] = packageJson[key]
  }

  modifiedPackageJson.main = path.join(paths[0], 'main.cjs')
  modifiedPackageJson.dependencies = {}

  // Optimized dependency copy logic
  const external = Array.isArray(viteConfig.build?.rollupOptions?.external)
    ? viteConfig.build.rollupOptions.external.filter(
        (x): x is string => typeof x === 'string',
      )
    : []
  for (const dep of external) {
    if (packageJson.dependencies?.[dep]) {
      modifiedPackageJson.dependencies[dep] = packageJson.dependencies[dep]
    }
  }

  await fs.promises.writeFile(
    path.join(paths[0], 'package.json'),
    JSON.stringify(modifiedPackageJson, null, 2),
    { encoding: 'utf-8' },
  )

  return modifiedPackageJson
}

run()
