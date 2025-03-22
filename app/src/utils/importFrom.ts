import { createRequire } from 'node:module'

const importCache: {
  [cacheKey: string]: any
} = {}

export function importFrom<T>(id: string): T {
  try {
    const require = createRequire(import.meta.url)
    importCache[id] ??= require(require.resolve(id))
  } catch {
    throw new Error(`"${id}" must be installed`)
  }

  return importCache[id]
}
