import { obfuscate } from 'js-confuser'

export default async function (code = '', isBrowser = false) {
  return await obfuscate(code, {
    target: isBrowser ? 'browser' : 'node',
    minify: true,
    compact: true,
    flatten: true,
    deadCode: false,

    rgf: true,
    globalConcealing: true,
    stringConcealing: true,
    stringCompression: false,
    stringEncoding: false,

    identifierGenerator: 'randomized',
    duplicateLiteralsRemoval: true,
    objectExtraction: true,
    renameVariables: true,
    renameGlobals: true,
    renameLabels: true,

    shuffle: true,
    calculator: true,
    dispatcher: true,
    astScrambler: true,
    variableMasking: true,
    opaquePredicates: true,
    lock: {
      domainLock: false,
      startDate: false,
      endDate: false,
      tamperProtection: false,
      selfDefending: true,
      integrity: true,
      antiDebug: true,
    },
  })
    .then(result => result.code)
    .catch(() => code)
}
