import type { Message } from './types'

type MessageHandler = (msg: Message, respond: (oMsg: Message, payload: any) => void) => void

/**
 * Sending messages between 'browser' and 'scene' is usually responseless.
 * To make exchanging messages easier, Messenger provides a simple API that provides responses in form of promises.
 * It's very flimsy and has virtually no error handling, yay!
 */
export default class Messenger {
  private messageMap: Map<number, (value?: unknown) => void>
  private isScene: boolean

  constructor(isScene: boolean, messageHandler: MessageHandler) {
    this.messageMap = new Map()
    this.isScene = isScene

    const objWithOnMessage = isScene ? window : figma.ui

    objWithOnMessage.onmessage = (message: any) => {
      let msg: Message
      if (this.isScene) {
        msg = message.data.pluginMessage
      } else {
        msg = message
      }
      // console.log(`${this.isScene ? 'ui  ' : 'code'} | RECV:`, msg)
      const respond = (oMsg, payload) => {
        const response: Message = {
          type: 'response',
          id: oMsg.id,
          payload,
        }
        if (this.isScene) {
          parent.postMessage({ pluginMessage: response }, '*')
        } else {
          figma.ui.postMessage(response)
        }
      }

      if (msg.type === 'response') {
        const resolve = this.messageMap.get(msg.id)
        if (resolve) {
          this.messageMap.delete(msg.id)
          resolve(msg.payload)
        }
      } else {
        messageHandler(msg, respond)
      }
    }
  }

  sendMessage(type: string, payload?: any): Promise<any> {
    return new Promise((resolve) => {
      const message: Message = {
        type,
        id: new Date().getTime() + Math.random(),
        payload,
      }
      // console.log(`${this.isScene ? 'ui  ' : 'code'} | SEND:`, message)
      if (this.isScene) {
        parent.postMessage({ pluginMessage: message }, '*')
      } else {
        figma.ui.postMessage(message)
      }

      this.messageMap.set(message.id, resolve)
    })
  }
}
