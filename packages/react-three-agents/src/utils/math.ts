import type { Vector3Tuple } from 'three'
import { Vector3 } from 'three'

export const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t
}

export const lerpVector3 = (start: Vector3Tuple, end: Vector3Tuple, t: number): Vector3Tuple => {
  return [
    lerp(start[0], end[0], t),
    lerp(start[1], end[1], t),
    lerp(start[2], end[2], t)
  ]
}

export const calculateDistance = (v1: Vector3Tuple, v2: Vector3Tuple): number => {
  const vector = new Vector3(...v1)
  return vector.distanceTo(new Vector3(...v2))
}

export const normalizeVector = (v: Vector3Tuple): Vector3Tuple => {
  const vector = new Vector3(...v)
  vector.normalize()
  return [vector.x, vector.y, vector.z]
}

export const addVectors = (v1: Vector3Tuple, v2: Vector3Tuple): Vector3Tuple => {
  const vector1 = new Vector3(...v1)
  const vector2 = new Vector3(...v2)
  vector1.add(vector2)
  return [vector1.x, vector1.y, vector1.z]
}

export const scaleVector = (v: Vector3Tuple, scale: number): Vector3Tuple => {
  const vector = new Vector3(...v)
  vector.multiplyScalar(scale)
  return [vector.x, vector.y, vector.z]
} 