/* eslint-disable react/jsx-handler-names */
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View, TextInput, Button, ScrollView, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { Paths } from 'expo-file-system'
import { setStringAsync } from 'expo-clipboard'

import useWorklet from './hooks/use-workket'

export default function App () {
  const { worklet, data } = useWorklet()

  const [mode, setMode] = useState('create')
  const [joinInvite, setJoinInvite] = useState('')

  const [invite, setInvite] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const roomReady = !!invite

  useEffect(() => {
    if (!roomReady) return

    const interval = setInterval(() => {
      worklet?.write({ tag: 'get-messages' })
    }, 1000)
    return () => clearInterval(interval)
  }, [roomReady])

  useEffect(() => {
    if (data.tag === 'invite') {
      setInvite(data.data)
    } else if (data.tag === 'messages') {
      setMessages(data.data)
    } else if (data.tag === 'log') {
      console.log(data.data)
    }
  }, [data])

  const onRoomCTA = () => {
    if (mode === 'join' && !joinInvite) {
      alert('Please type invite to join room')
      return
    }
    const data = {
      documentDir: Paths.document.uri.substring('file://'.length),
      invite: joinInvite
    }
    worklet?.write({ tag: 'ready', data })
  }

  const onSend = () => {
    worklet?.write({ tag: 'add-message', data: input })
    setInput('')
  }

  const renderSetupRoom = () => (
    <>
      <View style={styles.radioRow}>
        <TouchableOpacity style={styles.radioOption} onPress={() => setMode('create')}>
          <View style={[styles.radioCircle, mode === 'create' && styles.radioSelected]} />
          <Text>Create Room</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.radioOption} onPress={() => setMode('join')}>
          <View style={[styles.radioCircle, mode === 'join' && styles.radioSelected]} />
          <Text>Join Room</Text>
        </TouchableOpacity>
      </View>
      {mode === 'join' && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={joinInvite}
            onChangeText={val => setJoinInvite(val.trim())}
            placeholder='Type invite...'
          />
        </View>
      )}
      <Button
        title={mode === 'create' ? 'Create Room' : 'Join Room'}
        onPress={onRoomCTA}
      />
    </>
  )

  const renderChatRoom = () => (
    <>
      <Text>Invite: {invite}</Text>
      <TouchableOpacity style={styles.copyButton} onPress={() => setStringAsync(invite)}>
        <Text style={styles.copyText}>Copy Invite</Text>
      </TouchableOpacity>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder='Type your message...'
        />
        <Button title='Send' onPress={onSend} />
      </View>
      <Text style={styles.title}>Messages</Text>
      <ScrollView style={styles.messages}>
        {messages.map((msg, idx) => (
          <Text key={idx} style={styles.message}>{`${msg.text} ~ ${msg.info.at}`}</Text>
        ))}
      </ScrollView>
    </>
  )

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {roomReady ? renderChatRoom() : renderSetupRoom()}
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 16
  },
  radioRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#888',
    marginRight: 8,
    backgroundColor: '#fff'
  },
  radioSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 8
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginRight: 8
  },
  copyButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    marginTop: 8,
    marginBottom: 16
  },
  copyText: {
    color: '#fff'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12
  },
  messages: {
    flex: 1,
    alignSelf: 'stretch',
    marginBottom: 16
  },
  message: {
    marginVertical: 2
  }
})
