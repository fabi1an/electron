import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { app, dialog } from 'electron'
//@ts-expect-error - no types
import flashTrust from 'nw-flash-trust'

import { getAssetPath } from './getAssetPath'

export const addFlash = (swfPath: string) => {
  const pluginName = {
    win32: 'pepflashplayer.dll',
    linux: 'libpepflashplayer.so',
    darwin: 'PepperFlashPlayer.plugin',
  } as const

  const pluginFlashPath = getAssetPath(
    '..',
    'plugins',
    process.platform,
    process.arch,
    pluginName[process.platform as 'win32' | 'linux' | 'linux'],
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
  app.commandLine.appendSwitch('ppapi-flash-version', '34.0.0.277')
  app.commandLine.appendSwitch('ignore-certificate-errors', 'true')
  app.commandLine.appendSwitch('allow-insecure-localhost', 'true')
  app.commandLine.appendSwitch('disable-renderer-backgrounding')
  app.commandLine.appendSwitch('disable-site-isolation-trials')

  const flashTrustPath = path.join(
    app.getPath('userData'),
    'Pepper Data',
    'Shockwave Flash',
    'WritableRoot',
  )
  const cfgPath = path.join(flashTrustPath, '#Security', 'FlashPlayerTrust')
  if (!fs.existsSync(cfgPath)) fs.mkdirSync(cfgPath, { recursive: true })

  const trustManager = flashTrust.initSync(app.getName(), flashTrustPath)

  trustManager.empty()
  trustManager.add(swfPath)
}
