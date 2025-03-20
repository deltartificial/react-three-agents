import type { EnvironmentConfig } from '../types/environment.types'

export const buildWebSocketUrl = (config: Pick<EnvironmentConfig, 'serverPort' | 'secure'>): string => {
  const protocol = config.secure ? 'wss' : 'ws'
  return `${protocol}://localhost:${config.serverPort}`
}

export const isWebSocketSupported = (): boolean => {
  return typeof WebSocket !== 'undefined'
}

export const getWebSocketState = (readyState: number): string => {
  switch (readyState) {
    case WebSocket.CONNECTING:
      return 'connecting'
    case WebSocket.OPEN:
      return 'open'
    case WebSocket.CLOSING:
      return 'closing'
    case WebSocket.CLOSED:
      return 'closed'
    default:
      return 'unknown'
  }
}

export const isWebSocketOpen = (socket: WebSocket | null): boolean => {
  return socket?.readyState === WebSocket.OPEN
}

export const isWebSocketClosed = (socket: WebSocket | null): boolean => {
  return !socket || socket.readyState === WebSocket.CLOSED
} 