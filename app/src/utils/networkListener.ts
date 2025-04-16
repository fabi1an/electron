import { Buffer } from 'node:buffer'
import { EventEmitter } from 'node:events'
import { type BrowserWindow } from 'electron'

export class NetworkListener extends EventEmitter {
  private resources: Record<string, any> = {}
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    super()
    this.mainWindow = mainWindow
  }

  start() {
    try {
      this.mainWindow.webContents.debugger.attach('1.3')
    } catch (err) {
      this.emit('error', `Debugger attach failed: ${err}`)
      return this
    }

    this.mainWindow.webContents.debugger.on(
      'message',
      async (_, method, params) => {
        const { requestId, request, response, encodedDataLength } = params
        const resource = this.resources[requestId] ?? {}

        switch (method) {
          case 'Network.requestWillBeSent':
            if (!request.url) return
            resource.request = request
            resource.response = {}
            resource.timestamp = Date.now()
            this.resources[requestId] = resource
            this.emit('request', { requestId, resource })
            break

          case 'Network.responseReceived':
            if (response.fromDiskCache) {
              console.log(`File loaded from disk cache: ${response.url}`)
            }

            resource.response = response
            this.resources[requestId] = resource
            break

          case 'Network.loadingFinished':
            if (!resource?.request?.url) return
            this.mainWindow.webContents.debugger
              .sendCommand('Network.getResponseBody', { requestId })
              .then(({ body, base64Encoded }) => {
                switch (true) {
                  case resource.response?.mimeType?.includes(
                    'application/json',
                  ):
                    try {
                      resource.body = JSON.parse(body)
                    } catch {
                      resource.body = body
                    }
                    break
                  case base64Encoded:
                    resource.body = Buffer.from(body, 'base64')
                    break
                  default:
                    resource.body = body
                    break
                }
                resource.encodedDataLength = encodedDataLength
                resource.completed = true
                this.resources[requestId] = resource
                this.emit('complete', { requestId, resource })
              })
              .catch(err => {
                if (
                  err.message.includes(
                    'No resource with given identifier found',
                  )
                ) {
                  resource.completed = true
                  this.resources[requestId] = resource
                  this.emit('complete', { requestId, resource })
                } else {
                  this.emit('error', `Failed to retrieve response body: ${err}`)
                }
              })
            break

          default:
            break
        }
      },
    )

    this.mainWindow.webContents.debugger.sendCommand('Network.enable')

    return this
  }

  stop() {
    this.mainWindow.webContents.debugger.detach()
    this.resources = {}
  }
}
