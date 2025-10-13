/* eslint-disable no-undef */
import b4a from 'b4a'
import { Worklet } from 'react-native-bare-kit'

import bundle from '../worklet/app.bundle.mjs'

function runWorklet (opts = {}) {
  const {
    onData = noop,
    onError = noop,
    onClose = noop
  } = opts

  const worklet = new Worklet()
  worklet.start('/app.bundle', bundle)
  const { IPC } = worklet

  IPC.on('data', (data) => {
    const str = b4a.toString(data)
    const lines = str.split('\n')
    for (let msg of lines) {
      msg = msg.trim()
      if (!msg) continue
      if (msg) msgHandler(msg)
    }
  })
  IPC.on('error', (err) => onError(err))
  IPC.on('close', () => onClose())

  function msgHandler (msg) {
    const obj = parseMsg(msg)
    if (obj.tag === 'data') {
      onData(obj.data)
    } else if (obj.tag === 'error') {
      onError(obj.data)
    } else {
      console.log('Unknown message', msg)
    }
  }

  return {
    write: (data) => IPC.write(b4a.from(JSON.stringify({ tag: 'data', data }) + '\n')),
    close: () => IPC.end()
  }
}

function parseMsg (msg) {
  try {
    return JSON.parse(msg)
  } catch {
    return { error }
  }
}

function noop () {}

export default runWorklet
