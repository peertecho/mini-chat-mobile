import { useEffect, useState } from 'react'

import runWorklet from '../lib/run-worklet'

const useWorklet = () => {
  const [worklet, setWorklet] = useState(null)
  const [data, setData] = useState({})

  useEffect(() => {
    const worklet = runWorklet({
      onData: (data) => {
        setData(data)
      },
      onError: (error) => {
        console.error('Worklet.onError', error)
        worklet.close()
      },
      onClose: () => {
        console.log('Worklet.onClose')
      }
    })
    setWorklet(worklet)
    return () => worklet.close()
  }, [])

  return { worklet, data }
}

export default useWorklet
