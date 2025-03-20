import type { AgentMessage, WebSocketMessage, ConnectionMessage, ConnectionStatus } from '../../types/message.types'
import type { EnvironmentConfig } from '../../types/environment.types'

export class ConnectionService {
  private socket: WebSocket | null = null
  private config: EnvironmentConfig
  private reconnectAttempts = 0
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor(config: EnvironmentConfig) {
    this.config = config
  }

  connect(url: string): Promise<ConnectionStatus> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url)

        this.socket.onopen = () => {
          this.reconnectAttempts = 0
          resolve({ type: 'connection', id: url, status: 'connected' })
        }

        this.socket.onclose = () => {
          this.handleDisconnect()
          resolve({ type: 'connection', id: url, status: 'disconnected' })
        }

        this.socket.onerror = (event: Event) => {
          const errorEvent = event as ErrorEvent
          reject({ 
            type: 'connection', 
            id: url, 
            status: 'disconnected', 
            error: errorEvent.message || 'Unknown error occurred' 
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        reject({ 
          type: 'connection', 
          id: url, 
          status: 'disconnected', 
          error: errorMessage 
        })
      }
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  send(message: unknown): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    try {
      this.socket.send(JSON.stringify(message))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      throw new Error(errorMessage)
    }
  }

  onMessage(handler: (message: WebSocketMessage) => void): void {
    if (this.socket) {
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handler(message)
        } catch (error) {
          console.error('Failed to parse message:', error)
        }
      }
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.config.reconnectAttempts) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++
        this.connect(this.socket?.url || '')
      }, this.config.reconnectInterval)
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
} 