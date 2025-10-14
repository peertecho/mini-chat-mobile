/* eslint-disable no-undef */
const process = require('process')
const fs = require('fs').promises
const path = require('path')
const goodbye = require('graceful-goodbye')
const { IPC } = BareKit

const MiniChatRoom = require('./mini-chat-room')

/** @type {MiniChatRoom | undefined} */
let room

process.on('uncaughtException', (err) => {
  write('error', `${err?.stack || err}`)
  IPC.end()
})
process.on('unhandledRejection', (err) => {
  write('error', `${err?.stack || err}`)
  IPC.end()
})

IPC.on('error', (err) => onError(err))
IPC.on('close', () => onClose())
IPC.on('data', async (data) => {
  const lines = data.toString().split('\n')
  for (let msg of lines) {
    msg = msg.trim()
    if (!msg) continue

    const obj = JSON.parse(msg)
    await onData(obj)
  }
})

async function onError () {
  await room?.close()
}

async function onClose () {
  await room?.close()
}

async function onData (obj) {
  if (!obj.data?.noLog) write('log', obj)

  if (obj.tag === 'ready') {
    const { documentDir, invite } = obj.data
    const storage = path.join(documentDir, 'mini-chat', 'storage')
    room = new MiniChatRoom({ storage, invite })
    goodbye(() => room.close())
    await room.ready()

    write('invite', invite || await room.createInvite())
    return
  }

  if (!room) {
    write('error', 'Room not found')
    return
  }
  await room.ready()

  if (obj.tag === 'get-messages') {
    const messages = await room.getMessages()
    write('messages', messages)
  } else if (obj.tag === 'add-message') {
    const id = Math.random().toString(16).slice(2)
    await room.addMessage(id, obj.data, { at: new Date().toISOString() })
  } else if (obj.tag === 'reset') {
    write('invite', '')
    const storage = room.storage
    await room.close()
    await fs.rmdir(storage, { recursive: true })
  }
}

function write (tag, data) {
  IPC.write(Buffer.from(JSON.stringify({ tag, data }) + '\n'))
}
