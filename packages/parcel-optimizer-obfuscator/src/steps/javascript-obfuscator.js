//@ts-check
import { obfuscate } from 'javascript-obfuscator'

export default async function (code = '', isBrowser = false) {
  return await obfuscate(code, {
    target: isBrowser ? 'browser' : 'node',
    seed: 0,
    compact: true,
    simplify: true,

    deadCodeInjection: false,
    transformObjectKeys: true,
    numbersToExpressions: true,

    renameGlobals: true,
    identifierNamesGenerator: 'hexadecimal',

    stringArray: true,
    stringArrayRotate: true,
    stringArrayIndexShift: true,
    stringArrayThreshold: 0.5,
    stringArrayEncoding: ['rc4'],
    stringArrayIndexesType: ['hexadecimal-numeric-string'],
    stringArrayWrappersType: 'function',
    stringArrayWrappersCount: 5,
    stringArrayWrappersChainedCalls: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.75,
  }).getObfuscatedCode()
}
