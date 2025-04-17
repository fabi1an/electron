import { Optimizer } from '@parcel/plugin'
import { blobToString } from '@parcel/utils'
import javascriptObfuscator from './steps/javascript-obfuscator'
import jsConfuser from './steps/js-confuser'

const steps = [javascriptObfuscator, jsConfuser]

export default new Optimizer({
  async optimize({ contents, map, bundle }) {
    let code = await blobToString(contents)
    code = code.replace(/node:/g, '')

    if (!bundle.env.shouldOptimize) {
      return { contents: code, map }
    }

    const isBrowser = bundle.env.isBrowser();
    for (const step of steps) {
      if (step.constructor.name === 'AsyncFunction') code = await step(code, isBrowser)
      else code = step(code, isBrowser)
    }

    return {
      contents: code,
    }
  },
})
