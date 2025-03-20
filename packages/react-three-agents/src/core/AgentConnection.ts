import type { WebSocketMessage } from '../types/message.types'
import type { EnvironmentConfig } from '../types/environment.types'
import { create } from 'zustand'

export const useAgentConnection = create<Store>((set) => ({
  connected: false,
  agents: new Map(),
  error: null,
  socket: null,
  connect: async (url, config) => set({ connected: true }),
  disconnect: () => set({ connected: false }),
  sendMessage: () => {},
  updateAgentState: (agentId, state) => set((store) => {
    const agents = new Map(store.agents)
    agents.set(agentId, { ...agents.get(agentId), ...state } as AgentState)
    return { agents }
  }),
  setError: (error) => set({ error })
}))

export interface AgentState {
  position: [number, number, number]
  rotation: [number, number, number]
  action: string
  reward: number
  done: boolean
  message?: string
  error?: string
  agentDisconnected?: string
  [key: string]: unknown
}

export interface AgentMessage {
  type: 'state' | 'action' | 'reset' | 'info' | 'error'
  agentId: string
  data: Partial<AgentState>
}

interface Store {
  connected: boolean
  agents: Map<string, AgentState>
  error: string | null
  socket: WebSocket | null
  connect: (url: string, config: EnvironmentConfig) => Promise<void>
  disconnect: () => void
  sendMessage: (message: AgentMessage) => void
  updateAgentState: (agentId: string, state: Partial<AgentState>) => void
  setError: (error: string | null) => void
}

export class AgentConnection {
  private socket: WebSocket | null = null
  private store: Store
  private config: EnvironmentConfig
  private reconnectAttempts = 0
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor(store: Store, config: EnvironmentConfig) {
    this.store = store
    this.config = config
  }

  connect(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.socket = new WebSocket(url)

        this.socket.onopen = () => {
          this.reconnectAttempts = 0
          this.store.connect(url, this.config).catch(() => {
            this.store.setError('Failed to connect to store')
          })
          resolve()
        }

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage
            if ('type' in message && message.type === 'state') {
              this.store.updateAgentState(message.agentId, message.data)
            }
          } catch (error) {
            this.store.setError('Failed to parse message')
          }
        }

        this.socket.onerror = () => {
          this.store.setError('WebSocket connection error')
        }

        this.socket.onclose = () => {
          this.handleDisconnect()
          this.store.disconnect()
        }
      } catch (error) {
        this.store.setError('Failed to connect')
        reject(error)
      }
    })
  }

  sendMessage(message: AgentMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.store.setError('Cannot send message: not connected')
      return
    }

    try {
      this.socket.send(JSON.stringify(message))
    } catch (error) {
      this.store.setError('Failed to send message')
    }
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

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.config.reconnectAttempts) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++
        if (this.socket?.url) {
          this.connect(this.socket.url).catch(() => {
            this.store.setError('Failed to reconnect')
          })
        }
      }, this.config.reconnectInterval)
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
}
