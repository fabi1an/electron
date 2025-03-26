import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Configuration } from 'electron-builder'

const __dirname = dirname(fileURLToPath(import.meta.url))
const {
  _name,
  author: _author,
  description,
  version,
} = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'))
const name: string = _name ?? 'app'
const author: string = _author?.name ?? _author
const currentYear = new Date().getFullYear()
const appId = `com.${author.replace(/\s+/g, '-')}.${name}`.toLowerCase()

const artifactName = [`${name}-v${version}-`, '${os}.${ext}'].join('')

export default {
  appId,
  asarUnpack: '**/*.{node,dll}',
  copyright: `Copyright © ${currentYear} — ${author}`,
  npmRebuild: false,
  productName: name,
  directories: {
    buildResources: 'resources',
    output: 'dist/electron',
  },
  extraResources: [
    {
      filter: '**/*',
      from: 'resources/plugins/${platform}/${arch}',
      to: 'plugins/${platform}/${arch}',
    },
  ],
  files: [
    {
      filter: ['**/*', '!electron'],
      from: 'dist',
      to: 'dist',
    },
    {
      filter: ['**/*', '!plugins'],
      from: 'resources',
      to: 'resources',
    },
    'package.json',
  ],
  linux: {
    artifactName,
    category: 'Utilities',
    synopsis: description,
    target: ['AppImage'],
  },
  mac: {
    artifactName,
    target: [{ arch: 'x64', target: 'zip' }],
  },
  snap: {
    allowNativeWayland: true,
    executableArgs: ['--no-process-scanning'],
  },
  win: {
    artifactName,
    target: ['zip', 'portable'],
  },
} satisfies Configuration
