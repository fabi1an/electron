import path from 'node:path'

import { app } from 'electron'

export const RESOURCES_PATH = app.isPackaged
  ? path.join(__dirname, '..', '..')
  : path.join(__dirname, '..', 'resources')

export const getAssetPath = (...paths: string[]) => {
  let unpacked = false
  if (paths[0] === '..') {
    unpacked = true
    paths.shift()
  }

  if (app.isPackaged) {
    return path.join(
      ...[
        __dirname,
        '..',
        '..',
        ...(unpacked ? ['..'] : ['resources']),
        ...paths,
      ].filter(Boolean),
    )
  }
  return path.join(__dirname, '..', '..', 'resources', ...paths)
}
