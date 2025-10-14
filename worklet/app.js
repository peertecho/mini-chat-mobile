/* eslint-disable no-undef */
const process = require('process')
const path = require('path')
const goodbye = require('graceful-goodbye')
const { IPC } = BareKit

const MiniChatRoom = require('./mini-chat-room')

/** @type {MiniChatRoom | undefined} */
let room

process.on('uncaughtException', (err) => {
  write({ tag: 'error', data: `${err?.stack || err}` })
  IPC.end()
})
process.on('unhandledRejection', (err) => {
  write({ tag: 'error', data: `${err?.stack || err}` })
  IPC.end()
})

IPC.on('error', (err) => onError(err))
IPC.on('close', () => onClose())
IPC.on('data', async (data) => {
  try {
    const lines = data.toString().split('\n')
    for (let msg of lines) {
      msg = msg.trim()
      if (!msg) continue
      const obj = parseMsg(msg)

      if (obj.tag === 'data') {
        await onData(obj.data, obj)
      } else {
        write({ tag: 'error', data: `Unknown message ${msg}` })
      }
    }
  } catch (err) {
    write({ tag: 'error', data: `${err?.stack || err}` })
  }
})

function write (data) {
  IPC.write(Buffer.from(JSON.stringify({ tag: 'data', data }) + '\n'))
}

async function onError(err) {
  await room?.close()
}

async function onClose() {
  await room?.close()
}

async function onData (obj) {
  if (obj.tag !== 'get-messages') write({ tag: 'log', data: obj })

  if (obj.tag === 'ready') {
    const { documentDir, invite } = obj.data
    const storage = path.join(documentDir, 'mini-chat', 'storage')
    room = new MiniChatRoom({ storage, invite })
    goodbye(() => room.close())
    await room.ready()
    write({ tag: 'invite', data: invite || await room.createInvite() })
    return
  }

  if (!room) {
    write({ tag: 'error', data: 'Room not found' })
    return
  }
  await room.ready()

  if (obj.tag === 'get-invite') {
    const invite = await room.createInvite()
    write({ tag: 'invite', data: invite })
  } else if (obj.tag === 'get-messages') {
    const messages = await room.getMessages()
    write({ tag: 'messages', data: messages })
  } else if (obj.tag === 'add-message') {
    const id = Math.random().toString(16).slice(2)
    await room.addMessage(id, obj.data, { at: new Date().toISOString() })
  } else {
    write({ tag: 'error', data: `Unknown command ${JSON.stringify(obj)}` })
  }
}

function parseMsg (msg) {
  try {
    return JSON.parse(msg)
  } catch {
    return { tag: 'unknown', data: msg }
  }
}
