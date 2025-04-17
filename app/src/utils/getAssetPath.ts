import path from 'node:path'

import { app } from 'electron'

export const getAssetPath = (...paths: string[]) => {
  const rootDir = path.join(__dirname, '..', '..')
  let unpacked = false
  if (paths[0] === '..') {
    unpacked = true
    paths.shift()
  }

  if (app.isPackaged) {
    return path.join(
      ...[rootDir, ...(unpacked ? ['..'] : ['resources']), ...paths]
        .flat()
        .filter(Boolean),
    )
  }
  return path.join(rootDir, 'resources', ...paths)
}
