import { readable } from 'svelte/store'
import Messenger from '../Messenger'
import type { Message } from '../types'

let thisSet = null

export const messenger = new Messenger(
  true,
  (msg: Message, respond: (oMsg: any, payload?: any) => void) => {
    if (msg.type === 'selectionChange') {
      if (thisSet) {
        // Reset to zero for a second so selection
        // events with the same amount count too
        thisSet(0)
        thisSet(msg.payload)
      }
    }
    // courtesy response
    respond(msg, 'error')
  },
)

export const somethingSelected = readable(false, function start(set) {
  messenger.sendMessage('getSelection').then(set)
  thisSet = set
  return function stop() {
    thisSet = null
  }
})
