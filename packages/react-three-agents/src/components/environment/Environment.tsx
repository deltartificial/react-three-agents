import React, { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useConnectionStore } from '../../core/connection/connection.store'
import type { EnvironmentProps } from '../../types/environment.types'
import { DEFAULT_ENVIRONMENT_CONFIG, DEFAULT_CANVAS_PROPS } from '../../constants/defaults'
import { buildWebSocketUrl } from '../../utils/websocket'

export function Environment({
  serverUrl,
  serverPort = DEFAULT_ENVIRONMENT_CONFIG.serverPort,
  startServer = true,
  children,
  onConnect,
  onDisconnect,
  onError,
  onAgentAction,
  noCanvas = false,
  canvasProps = DEFAULT_CANVAS_PROPS,
  secure = DEFAULT_ENVIRONMENT_CONFIG.secure,
  serverTimeout = DEFAULT_ENVIRONMENT_CONFIG.timeout,
}: EnvironmentProps) {
  const connect = useConnectionStore((state) => state.connect)
  const disconnect = useConnectionStore((state) => state.disconnect)
  const connected = useConnectionStore((state) => state.connected)
  const error = useConnectionStore((state) => state.error)
  const setError = useConnectionStore((state) => state.setError)
  const [connectionUrl, setConnectionUrl] = useState<string | null>(null)

  useEffect(() => {
    const url = serverUrl || buildWebSocketUrl({ serverPort, secure })
    setConnectionUrl(url)
  }, [serverUrl, serverPort, secure])

  useEffect(() => {
    if (error && onError) {
      onError(error)
    }
  }, [error, onError])

  useEffect(() => {
    if (connectionUrl) {
      connect(connectionUrl, {
        serverPort,
        secure,
        timeout: serverTimeout,
        reconnectAttempts: DEFAULT_ENVIRONMENT_CONFIG.reconnectAttempts,
        reconnectInterval: DEFAULT_ENVIRONMENT_CONFIG.reconnectInterval
      }).catch((error) => {
        setError(error instanceof Error ? error.message : 'Connection failed')
      })
    }

    return () => disconnect()
  }, [connectionUrl, connect, disconnect, serverPort, secure, serverTimeout, setError])

  useEffect(() => {
    if (connected) {
      onConnect?.()
    } else {
      onDisconnect?.()
    }
  }, [connected, onConnect, onDisconnect])

  if (noCanvas) {
    return <>{children}</>
  }

  return (
    <Canvas {...canvasProps}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />
      {children}
    </Canvas>
  )
} 