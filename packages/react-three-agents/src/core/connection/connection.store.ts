import { create } from 'zustand'
import type { AgentState } from '../../types/agent.types'
import type { AgentMessage, WebSocketMessage } from '../../types/message.types'
import type { EnvironmentConfig } from '../../types/environment.types'
import { ConnectionService } from './connection.service'

interface ConnectionStore {
  connected: boolean
  agents: Map<string, AgentState>
  error: string | null
  socket: WebSocket | null
  onConnect?: (url: string) => void
  onDisconnect?: (url: string) => void
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: string) => void
  connect: (url: string, config: EnvironmentConfig) => Promise<void>
  disconnect: () => void
  sendMessage: (message: AgentMessage) => void
  updateAgentState: (agentId: string, state: Partial<AgentState>) => void
  setError: (error: string | null) => void
  send: (message: unknown) => void
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  connected: false,
  agents: new Map(),
  error: null,
  socket: null,

  connect: async (url: string, config: EnvironmentConfig) => {
    const service = new ConnectionService(config)
    try {
      await service.connect(url)
      set({ connected: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      set({ error: errorMessage })
      throw error
    }
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close()
      set({ connected: false, socket: null })
    }
  },

  sendMessage: (message: AgentMessage) => {
    const { socket } = get()
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  },

  updateAgentState: (agentId: string, state: Partial<AgentState>) => {
    const agents = new Map(get().agents)
    const currentState = agents.get(agentId) || {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      action: '',
      reward: 0,
      done: false
    }
    agents.set(agentId, { ...currentState, ...state })
    set({ agents })
  },

  setError: (error: string | null) => set({ error }),

  send: (message: unknown) => {
    const { socket } = get()
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      const store = get()
      if (store.onError) {
        store.onError('WebSocket is not connected')
      }
      return
    }
    try {
      socket.send(JSON.stringify(message))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      const store = get()
      if (store.onError) {
        store.onError(errorMessage)
      }
    }
  }
})) 