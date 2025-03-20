import { z } from 'zod'
import type { Vector3Tuple } from 'three'

export const vector3Schema = z.tuple([
  z.number(),
  z.number(),
  z.number()
]) as z.ZodType<Vector3Tuple>

export const agentStateSchema = z.object({
  position: vector3Schema,
  rotation: vector3Schema,
  action: z.string(),
  reward: z.number(),
  done: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  agentDisconnected: z.string().optional()
}).passthrough()

export const messageSchema = z.object({
  type: z.enum(['state', 'action', 'reset', 'info', 'error']),
  agentId: z.string(),
  data: z.record(z.any())
})

export const environmentConfigSchema = z.object({
  serverPort: z.number().int().positive(),
  secure: z.boolean(),
  timeout: z.number().int().positive(),
  reconnectAttempts: z.number().int().nonnegative(),
  reconnectInterval: z.number().int().positive()
})

export type AgentStateSchema = z.infer<typeof agentStateSchema>
export type MessageSchema = z.infer<typeof messageSchema>
export type EnvironmentConfigSchema = z.infer<typeof environmentConfigSchema> 