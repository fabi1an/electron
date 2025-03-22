import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { app, dialog } from 'electron'
import flashTrust from 'nw-flash-trust'

import { getAssetPath } from './getAssetPath'

export const addFlash = (swfPath: string) => {
  const pluginName = {
    win32: 'pepflashplayer.dll',
    linux: 'libpepflashplayer.so',
    darwin: 'PepperFlashPlayer.plugin',
  }

  const pluginFlashPath = getAssetPath(
    '..',
    'plugins',
    process.platform,
    process.arch,
    pluginName[process.platform],
  )

  if (!fs.existsSync(pluginFlashPath)) {
    dialog.showErrorBox(
      'Flash Player Plugin Missing',
      `The Flash Player plugin (${pluginFlashPath}) is missing from the plugins directory. Please reinstall the application to ensure all necessary files are included.`,
    )
    app.quit()
    return
  }

  app.commandLine.appendSwitch('ppapi-flash-path', pluginFlashPath)
  app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.465')

  const trustFlashPath = path.join(
    app.getPath('userData'),
    'Pepper Data',
    'Shockwave Flash',
    'WritableRoot',
  )
  const trustManager = flashTrust.initSync(app.getName(), trustFlashPath)

  trustManager.empty()
  trustManager.add(swfPath)
}
