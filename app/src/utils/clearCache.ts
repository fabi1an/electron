import { session } from 'electron'

export const clearCache = () =>
  setTimeout(() => {
    session.defaultSession.clearCache()
    require('node:v8').setFlagsFromString('--expose_gc')
    global.gc = require('node:vm').runInNewContext('gc')
  }, 5_000)
