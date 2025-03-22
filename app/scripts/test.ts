import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import url from 'node:url'
import builder from 'electron-builder'
import * as vite from 'vite'
import { hideBin } from 'yargs/helpers'
import { importFrom } from '../src/utils/importFrom'
import { getMainProcessCommonConfig } from './helpers'

const esbuild = importFrom('esbuild') as typeof import('esbuild')
const yargs = importFrom('yargs') as typeof import('yargs/yargs')
const dirname = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.join(dirname, '..')
console.log(root)
const buildDirPath = path.join(root, 'dist_electron', 'build')
const packageDirPath = path.join(root, 'dist_electron', 'bundled')
const mainFileName = 'main.js'
const commonConfig = getMainProcessCommonConfig(root)

const rawArgs = yargs
  .default(hideBin(process.argv))
  .option('nosign', {
    type: 'boolean',
    description: 'Run electron-builder without code signing',
  })
  .option('nopackage', {
    type: 'boolean',
    description: 'Only build the source files, electron-builder will not run',
  })

const argv = rawArgs.parse()
if (argv.nosign) {
  process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false'
}

updatePaths()
await buildMainProcessSource()
await buildRendererProcessSource()
copyPackageJson()

if (!argv.nopackage) {
  await packageApp()
}

function updatePaths() {
  for (const _ of [
    buildDirPath,
    packageDirPath,
    path.join(buildDirPath, 'node_modules'),
  ]) {
    fs.rmSync(_, { recursive: true, force: true })
    fs.mkdirSync(_, { recursive: true })
  }
}

async function buildMainProcessSource() {
  const result = await esbuild.build({
    ...commonConfig,
    outdir: path.join(buildDirPath),
  })

  if (result.errors.length) {
    console.error('app build failed due to main process source build')
    result.errors.forEach(err => console.error(err))
    process.exit(1)
  }
}

async function buildRendererProcessSource() {
  const base = 'app://'
  const outDir = path.join(buildDirPath, 'src')
  await vite.build({
    base: `/${base}`,
    root: path.join(root, 'src'),
    build: { outDir, sourcemap: true },
    plugins: [],
  })
  removeBaseLeadingSlash(outDir, base)
}

/**
 * Copies the package.json file to the build folder with the
 * following changes:
 * - Irrelevant fields are removed.
 * - Non-external deps (those that are bundled) and devDeps are removed.
 * - Main file is updated to the bundled main process JS file.
 */
function copyPackageJson() {
  const packageJsonText = fs.readFileSync(path.join(root, 'package.json'), {
    encoding: 'utf-8',
  })

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

  modifiedPackageJson.main = mainFileName
  modifiedPackageJson.dependencies = {}

  for (const dep of commonConfig.external) {
    modifiedPackageJson.dependencies[dep] = packageJson.dependencies[dep]
  }

  fs.writeFileSync(
    path.join(buildDirPath, 'package.json'),
    JSON.stringify(modifiedPackageJson, null, 2),
    {
      encoding: 'utf-8',
    },
  )
}

/**
 * Packages the app using electron builder.
 *
 * Note: this also handles signing and notarization if the
 * appropriate flags are set.
 *
 * Electron builder cli [commands](https://www.electron.build/cli)
 * are passed on as builderArgs.
 */
async function packageApp() {
  const { configureBuildCommand } = await import(
    'electron-builder/out/builder.js'
  )

  const builderArgs = rawArgs
    .command(['build', '*'], 'Build', configureBuildCommand)
    .parse()

  for (const opt of ['nosign', 'nopackage']) {
    delete builderArgs[opt]
  }

  const buildOptions = {
    config: {
      directories: { output: packageDirPath, app: buildDirPath },
      files: ['**'],
      extends: null,
    },
    ...builderArgs,
  }

  await builder.build(buildOptions)
}

/**
 * Removes leading slash from all renderer files
 * electron uses a custom registered protocol to load the
 * files: "app://"
 *
 * @param {string} dir
 * @param {string} base
 */
function removeBaseLeadingSlash(dir, base) {
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file)
    if (fs.lstatSync(filePath).isDirectory()) {
      removeBaseLeadingSlash(filePath, base)
      continue
    }

    const contents = fs.readFileSync(filePath).toString('utf-8')
    fs.writeFileSync(filePath, contents.replaceAll(`/${base}`, base))
  }
}
