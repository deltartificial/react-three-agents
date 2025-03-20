import { create } from 'zustand'
import type { AgentState } from '../../types/agent.types'
import type { AgentMessage } from '../../types/message.types'
import type { EnvironmentConfig } from '../../types/environment.types'
import { ConnectionService } from './connection.service'

interface ConnectionStore {
  service: ConnectionService | null
  connected: boolean
  agents: Map<string, AgentState>
  error: string | null
  connect: (url: string, config: EnvironmentConfig) => Promise<void>
  disconnect: () => void
  sendMessage: (message: AgentMessage) => void
  updateAgentState: (agentId: string, state: Partial<AgentState>) => void
  setError: (error: string | null) => void
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  service: null,
  connected: false,
  agents: new Map(),
  error: null,

  connect: async (url: string, config: EnvironmentConfig) => {
    const service = new ConnectionService(config)
    
    try {
      await service.connect(url)
      
      service.onMessage((message) => {
        if (message.type === 'state') {
          get().updateAgentState(message.agentId, message.data)
        }
      })
      
      set({ service, connected: true, error: null })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Connection failed' })
    }
  },

  disconnect: () => {
    const { service } = get()
    if (service) {
      service.disconnect()
      set({ service: null, connected: false })
    }
  },

  sendMessage: (message: AgentMessage) => {
    const { service } = get()
    if (service?.isConnected()) {
      service.send(message)
    } else {
      set({ error: 'Cannot send message: not connected' })
    }
  },

  updateAgentState: (agentId: string, state: Partial<AgentState>) => {
    set((store) => {
      const agents = new Map(store.agents)
      const currentState = agents.get(agentId) || {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        action: '',
        reward: 0,
        done: false,
      }
      agents.set(agentId, { ...currentState, ...state })
      return { agents }
    })
  },

  setError: (error: string | null) => set({ error })
})) 