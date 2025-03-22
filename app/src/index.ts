import process from 'node:process'
import { app, BrowserWindow } from 'electron'

import { addFlash } from './utils/flash'
import { getAssetPath } from './utils/getAssetPath'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'false'

let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null
const swfPath = 'https://game.aq.com/game/gamefiles/Loader3.swf'

const createSplashWindow = () => {
  splashWindow = new BrowserWindow({
    width: 720,
    height: 306,
    show: false,
    frame: false,
    center: true,
    alwaysOnTop: true,
    transparent: true,
    skipTaskbar: true,
    resizable: false,
  })

  splashWindow.loadFile(getAssetPath('splash.html'))
  return new Promise(resolve => {
    splashWindow?.show()
    splashWindow!.webContents.once('did-finish-load', resolve)
  })
}

const createMainWindow = async () => {
  mainWindow = new BrowserWindow({
    show: false,
    center: true,
    width: 960,
    height: 550,
    webPreferences: {
      contextIsolation: true,
      webviewTag: false,
      plugins: true,
    },
  })

  mainWindow.setMenu(null)
  mainWindow.setAspectRatio(960 / 550, { width: 960, height: 550 })

  mainWindow.webContents.on('did-frame-finish-load', (event, isMainFrame) => {
    const url = new URL(mainWindow!.webContents.getURL())
    if (isMainFrame && url.pathname.endsWith('.swf')) {
      mainWindow!.webContents.insertCSS(`
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      embed {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      `)
    }
  })

  mainWindow.loadURL(swfPath)
  let showMainWindow: NodeJS.Timeout | null = null
  let pendingFlashRequests = 0

  const onBeforeRequest = (
    details: Electron.OnBeforeRequestListenerDetails,
    callback: (response: Electron.Response) => void,
  ) => {
    if (splashWindow) {
      if (showMainWindow === null) {
        showMainWindow = setTimeout(() => {
          if (showMainWindow === null) return

          if (pendingFlashRequests === 0) {
            if (splashWindow) {
              splashWindow.webContents
                .executeJavaScript(
                  `
                document.getElementById('loading').style.display = 'none';
                document.getElementById('starting').style.display = 'block';
              `,
                )
                .then(() => {
                  setTimeout(() => {
                    splashWindow?.close()
                    splashWindow = null

                    mainWindow?.show()
                    mainWindow?.focus()
                  }, 3000)
                })
            }
            clearTimeout(showMainWindow)
            showMainWindow.unref()
            showMainWindow = null

            mainWindow!.webContents.session.webRequest.onBeforeRequest(null)
            mainWindow!.webContents.session.webRequest.onCompleted(null)
          } else {
            showMainWindow?.refresh()
          }
        }, 10 * 1000)
      }

      if (new URL(details.url).pathname.endsWith('.swf')) pendingFlashRequests++
      showMainWindow?.refresh()
    }

    callback({ cancel: false })
  }

  const onCompleted = (details: Electron.OnCompletedListenerDetails) => {
    if (new URL(details.url).pathname.endsWith('.swf')) pendingFlashRequests--
    showMainWindow?.refresh()
  }

  mainWindow!.webContents.session.webRequest.onBeforeRequest(
    { urls: ['*://*/*'] },
    onBeforeRequest,
  )
  mainWindow!.webContents.session.webRequest.onCompleted(
    { urls: ['*://*/*'] },
    onCompleted,
  )
}

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
    await createSplashWindow()
    await createMainWindow()
  })
  .catch(console.error)

if (process.platform === 'win32') {
  process.on('message', data => data === 'graceful-exit' && app.quit())
} else process.on('SIGTERM', () => app.quit())
