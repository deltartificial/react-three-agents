import type { Vector3Tuple } from 'three'

export interface AgentState {
  position: Vector3Tuple
  rotation: Vector3Tuple
  action: string
  reward: number
  done: boolean
  message?: string
  error?: string
  agentDisconnected?: string
  [key: string]: any
}

export interface AgentProps {
  id: string
  model?: React.ReactNode
  onStateChange?: (state: AgentState) => void
  color?: string
  size?: number
  showLabel?: boolean
  labelContent?: string | ((state: AgentState) => string)
  smoothing?: number
  onClick?: (id: string, state: AgentState) => void
  initialPosition?: Vector3Tuple
  initialRotation?: Vector3Tuple
  frustumCulled?: boolean
  labelStyle?: React.CSSProperties
}

export interface AgentAction {
  agentId: string
  position?: Vector3Tuple
  rotation?: Vector3Tuple
  action?: string
} 