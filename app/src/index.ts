import { type Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { app, BrowserWindow, session } from 'electron'

import { addFlash } from './utils/flash'
import { NetworkListener } from './utils/networkListener'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'false'

let networkListener: NetworkListener | null = null
let mainWindow: BrowserWindow | null = null
const swfPath = 'https://game.aq.com/game/'
const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36 Edg/90.0.818.51'

function saveBufferToFile(buffer: Buffer, filepath: string) {
  const downloadsPath = path.join(app.getPath('downloads'), 'aqwps')
  const filePath = path.resolve(
    path.join(downloadsPath, new URL(swfPath).hostname, filepath),
  )
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
  }

  fs.writeFile(filePath, buffer, err => {
    if (err) {
      console.error('Failed to save file:', err)
    } else {
      console.log('File saved to:', filePath)
    }
  })
}

const createMainWindow = async () => {
  mainWindow = new BrowserWindow({
    show: true,
    center: true,
    width: 960,
    height: 550,
    webPreferences: {
      allowRunningInsecureContent: true,
      webSecurity: false,
      contextIsolation: true,
      webviewTag: false,
      plugins: true,
    },
  })

  mainWindow.setMenu(null)
  mainWindow.setAspectRatio(960 / 550, { width: 960, height: 550 })
  mainWindow.webContents.userAgent = userAgent
  mainWindow.webContents.openDevTools({ mode: 'detach' })
  session.defaultSession.webRequest.onBeforeSendHeaders((details, fn) => {
    details.requestHeaders['User-Agent'] = userAgent
    details.requestHeaders.artixmode = 'launcher'
    details.requestHeaders['x-requested-with'] = 'ShockwaveFlash/32.0.0.371'
    fn({ requestHeaders: details.requestHeaders, cancel: false })
  })
  await mainWindow.webContents.session.clearHostResolverCache()

  networkListener = new NetworkListener(mainWindow).start()

  networkListener
    .on('request', ({ requestId, resource }) => {
      console.log('Request started:', requestId, resource.request.url)
    })
    .on('complete', ({ resource }) => {
      const filePath =
        new URL(resource.response.url).searchParams.get('path')
        ?? new URL(resource.response.url).pathname
      if (['swf', 'mp3'].some(ext => filePath.includes(`.${ext}`))) {
        saveBufferToFile(resource.body, filePath)
      }
    })
    .on('error', err => {
      console.error('Network error:', err)
    })

  mainWindow.webContents.on('did-frame-finish-load', (_, isMainFrame) => {
    if (!isMainFrame) return

    mainWindow?.webContents.insertCSS(`
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
      embed { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    `)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  await mainWindow.loadURL(swfPath)
}

app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-renderer-backgrounding')
switch (process.platform) {
  case 'linux':
    app.commandLine.appendSwitch('no-sandbox')
    break
  case 'win32':
    app.commandLine.appendSwitch('high-dpi-support', '1')
    app.commandLine.appendSwitch('force-device-scale-factor', '1')
    break
}

app
  .on('activate', () => {
    if (mainWindow === null) createMainWindow()
  })
  .on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

addFlash(swfPath)
app
  .whenReady()
  .then(async () => {
    await createMainWindow()
  })
  .catch(console.error)

if (process.platform === 'win32') {
  process.on('message', data => data === 'graceful-exit' && app.quit())
} else process.on('SIGTERM', () => app.quit())
