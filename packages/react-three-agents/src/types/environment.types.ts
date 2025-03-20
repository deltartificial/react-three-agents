import type { ReactNode } from 'react'
import type { AgentAction } from './agent.types'

export interface EnvironmentProps {
  serverUrl?: string
  serverPort?: number
  startServer?: boolean
  children?: ReactNode
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
  onAgentAction?: (action: AgentAction) => void
  noCanvas?: boolean
  canvasProps?: Record<string, any>
  secure?: boolean
  serverTimeout?: number
}

export interface EnvironmentState {
  serverStarted: boolean
  connected: boolean
  connectionUrl: string | null
  error: string | null
}

export interface EnvironmentConfig {
  serverPort: number
  secure: boolean
  timeout: number
  reconnectAttempts: number
  reconnectInterval: number
} 