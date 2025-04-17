import { Optimizer } from '@parcel/plugin'
import { blobToString } from '@parcel/utils'
import JavaScriptObfuscator from 'javascript-obfuscator'

export default new Optimizer({
  async loadConfig({ config }) {
    const pkg = await config.getConfig(['package.json'])

    const pkgs = {
      ...pkg.devDependencies,
      ...pkg.dependencies,
    }
    const depend = Object.keys(pkgs).filter(k => {
      return !/workspace/.test(pkgs[k])
    })

    return {
      depend,
    }
  },
  async optimize({ contents, map, bundle, config }) {
    let code = await blobToString(contents)
    code = code.replace(/node:/g, '')

    if (!bundle.env.shouldOptimize) {
      return { contents: code, map }
    }

    code = await JavaScriptObfuscator.obfuscate(code, {
      target: bundle.env.isBrowser() ? 'browser' : 'node',
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.8,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.2,
      debugProtection: false,
      debugProtectionInterval: 0,
      disableConsoleOutput: false,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      transformObjectKeys: true,
      numbersToExpressions: true,
      renameGlobals: true,
      selfDefending: true,
      simplify: true,
      exclude: config.depend.map(v => `require("${v}")`).concat(config.depend),
      splitStrings: true,
      splitStringsChunkLength: 7,
      ignoreImports: true,
      stringArray: true,
      stringArrayCallsTransform: false,
      stringArrayCallsTransformThreshold: 0.5,
      stringArrayEncoding: ['rc4'],
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayWrappersCount: 1,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 2,
      stringArrayWrappersType: 'variable',
      stringArrayThreshold: 0.75,
      unicodeEscapeSequence: false,
      seed: 10,
      domainLock: [],
    }).getObfuscatedCode()

    return {
      contents: code,
    }
  },
})
