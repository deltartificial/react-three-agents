import type { EnvironmentConfig } from '../types/environment.types'
import type { Vector3Tuple } from 'three'

export const DEFAULT_ENVIRONMENT_CONFIG: EnvironmentConfig = {
  serverPort: 8765,
  secure: false,
  timeout: 30000,
  reconnectAttempts: 3,
  reconnectInterval: 5000
}

export const DEFAULT_POSITION: Vector3Tuple = [0, 0, 0]
export const DEFAULT_ROTATION: Vector3Tuple = [0, 0, 0]

export const DEFAULT_AGENT_CONFIG = {
  color: 'blue',
  size: 1,
  showLabel: false,
  smoothing: 0.1,
  frustumCulled: true
}

export const DEFAULT_CANVAS_PROPS = {
  camera: { position: [10, 10, 10] },
  shadows: true,
  dpr: [1, 2]
} 