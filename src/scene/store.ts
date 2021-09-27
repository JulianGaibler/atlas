import { Readable, readable } from 'svelte/store'
import Messenger from '../Messenger'
import type { Message } from '../types'

let selectionSet = null
let progressSet = null
let mapUpdateSet = null

export const messenger = new Messenger(
  true,
  (msg: Message, respond: (oMsg: any, payload?: any) => void) => {
    if (msg.type === 'selectionChange') {
      if (selectionSet) {
        // Reset to zero for a second so selection
        // events with the same amount count too
        selectionSet(0)
        selectionSet(msg.payload)
      }
    } else if (msg.type === 'progressUpdate') {
      if (progressSet) {
        progressSet(msg.payload)
      }
    } else if (msg.type === 'updatedLocalMap') {
      if (mapUpdateSet) {
        mapUpdateSet(msg.payload ? new Date(msg.payload) : null)
      }
    }
    // courtesy response
    respond(msg, true)
  },
)

export const somethingSelected = readable(false, function start(set) {
  messenger.sendMessage('getSelection').then(set)
  selectionSet = set
  return function stop() {
    selectionSet = null
  }
})

export const updatedLocalMap: Readable<Date | null> = readable(null, function start(set) {
  messenger.sendMessage('getLastMapUpdate').then((msg) => set(msg ? new Date(msg) : null))
  mapUpdateSet = set
  return function stop() {
    mapUpdateSet = null
  }
})

export const progressStatus = readable(
  { totalTasks: 0, tasksDone: 0, done: true, type: 'change' },
  function start(set) {
    progressSet = set
    return function stop() {
      progressSet = null
    }
  },
)
