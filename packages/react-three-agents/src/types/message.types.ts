import type { AgentState } from './agent.types'

export type MessageType = 'state' | 'action' | 'reset' | 'info' | 'error' | 'connection'

export interface BaseMessage {
  type: MessageType
  agentId: string
  data: Record<string, unknown>
}

export interface StateMessage extends BaseMessage {
  type: 'state'
  data: {
    position: [number, number, number]
    rotation: [number, number, number]
    action: string
    reward: number
    done: boolean
  }
}

export interface ConnectionStatus {
  type: 'connection'
  id: string
  status: 'connected' | 'disconnected'
  error?: string
}

export type WebSocketMessage = StateMessage | ConnectionStatus

export interface AgentMessage {
  type: MessageType
  agentId: string
  data: Partial<AgentState>
}

export type ConnectionMessage = ConnectionStatus 