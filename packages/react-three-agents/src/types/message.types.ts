import type { AgentState } from './agent.types'

export type MessageType = 'state' | 'action' | 'reset' | 'info' | 'error'

export interface AgentMessage {
  type: MessageType
  agentId: string
  data: Partial<AgentState>
}

export interface WebSocketMessage {
  type: MessageType
  agentId: string
  data: Record<string, any>
}

export interface ConnectionMessage {
  type: 'connection'
  id: string
  status: 'connected' | 'disconnected'
  error?: string
} 