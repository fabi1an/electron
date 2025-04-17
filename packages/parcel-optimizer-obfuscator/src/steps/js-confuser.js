import { obfuscate } from 'js-confuser'

export default async function (code = "", isBrowser = false) {
  return await obfuscate(code, {
    target: isBrowser ? "browser" : "node",
    compact: true,
    flatten: true,
    deadCode: false,

    globalConcealing: true,
    stringConcealing: true,
    stringCompression: false,
    stringEncoding: false,

    identifierGenerator: "randomized",
    duplicateLiteralsRemoval: true,
    objectExtraction: true,
    renameVariables: true,
    renameGlobals: true,
    renameLabels: true,

    dispatcher: true,
    opaquePredicates: 0.35,
    controlFlowFlattening: 0.08,
    shuffle: { hash: 0.8, true: 0.8 },
  })
    .then(_ => _.code)
    .catch(() => code)
}
