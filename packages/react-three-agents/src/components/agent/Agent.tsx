import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Group, Vector3Tuple } from 'three'
import { useConnectionStore } from '../../core/connection/connection.store'
import type { AgentProps, AgentState } from '../../types/agent.types'
import { DEFAULT_AGENT_CONFIG, DEFAULT_POSITION, DEFAULT_ROTATION } from '../../constants/defaults'
import { lerpVector3 } from '../../utils/math'

export interface AgentProps {
  id: string
  state: AgentState
  smoothing?: number
  onClick?: (id: string, state: AgentState) => void
}

export const Agent = ({ id, state, smoothing = 0.1, onClick }: AgentProps) => {
  const ref = useRef<Group>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.position.set(...(state.position as Vector3Tuple))
    ref.current.rotation.set(...(state.rotation as Vector3Tuple))
  }, [state.position, state.rotation])

  useFrame(() => {
    if (!ref.current) return

    const targetPosition = state.position as Vector3Tuple
    const targetRotation = state.rotation as Vector3Tuple
    const currentPosition = [
      ref.current.position.x,
      ref.current.position.y,
      ref.current.position.z
    ] as Vector3Tuple
    const currentRotation = [
      ref.current.rotation.x,
      ref.current.rotation.y,
      ref.current.rotation.z
    ] as Vector3Tuple

    const newPosition = lerpVector3(currentPosition, targetPosition, smoothing)
    const newRotation = lerpVector3(currentRotation, targetRotation, smoothing)

    ref.current.position.set(...newPosition)
    ref.current.rotation.set(...newRotation)
  })

  const handleClick = () => {
    if (onClick) {
      onClick(id, state)
    }
  }

  return (
    <group ref={ref} onClick={handleClick}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="blue" />
      </mesh>
    </group>
  )
}

export function AgentComponent({
  id,
  model,
  onStateChange,
  color = DEFAULT_AGENT_CONFIG.color,
  size = DEFAULT_AGENT_CONFIG.size,
  showLabel = DEFAULT_AGENT_CONFIG.showLabel,
  labelContent,
  smoothing = DEFAULT_AGENT_CONFIG.smoothing,
  onClick,
  initialPosition = DEFAULT_POSITION,
  initialRotation = DEFAULT_ROTATION,
  frustumCulled = DEFAULT_AGENT_CONFIG.frustumCulled,
  labelStyle,
}: AgentProps) {
  const groupRef = useRef<Group>(null)
  const agents = useConnectionStore((state) => state.agents)
  const sendMessage = useConnectionStore((state) => state.sendMessage)
  const [label, setLabel] = useState<string>('')

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...initialPosition)
      groupRef.current.rotation.set(...initialRotation)
    }
  }, [initialPosition, initialRotation])

  useEffect(() => {
    const agentState = agents.get(id)
    if (agentState) {
      onStateChange?.(agentState)

      if (showLabel) {
        setLabel(
          typeof labelContent === 'function'
            ? labelContent(agentState)
            : labelContent || `Agent ${id}`
        )
      }
    }
  }, [agents, id, onStateChange, showLabel, labelContent])

  useFrame(() => {
    if (!groupRef.current) return

    const agentState = agents.get(id)
    if (agentState) {
      const targetPosition = agentState.position as Vector3Tuple
      const targetRotation = agentState.rotation as Vector3Tuple

      const currentPosition = [
        groupRef.current.position.x,
        groupRef.current.position.y,
        groupRef.current.position.z
      ] as Vector3Tuple

      const newPosition = lerpVector3(currentPosition, targetPosition, smoothing)
      groupRef.current.position.set(...newPosition)

      const currentRotation = [
        groupRef.current.rotation.x,
        groupRef.current.rotation.y,
        groupRef.current.rotation.z
      ] as Vector3Tuple

      groupRef.current.rotation.x += (targetRotation[0] - groupRef.current.rotation.x) * smoothing
      groupRef.current.rotation.y += (targetRotation[1] - groupRef.current.rotation.y) * smoothing
      groupRef.current.rotation.z += (targetRotation[2] - groupRef.current.rotation.z) * smoothing
    }
  })

  const handleClick = (event: any) => {
    event.stopPropagation()
    
    sendMessage({
      type: 'action',
      agentId: id,
      data: { action: 'click' }
    })
    
    onClick?.(id, agents.get(id) || {} as AgentState)
  }

  const defaultModel = useMemo(() => (
    <>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color={color} />
    </>
  ), [size, color])

  const mergedLabelStyle = useMemo(() => ({
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    pointerEvents: 'none' as const,
    ...labelStyle
  }), [labelStyle])

  return (
    <group ref={groupRef} frustumCulled={frustumCulled}>
      <mesh onClick={handleClick}>
        {model || defaultModel}
      </mesh>

      {showLabel && label && (
        <Html
          position={[0, size + 0.5, 0]}
          center
          style={mergedLabelStyle}
        >
          {label}
        </Html>
      )}
    </group>
  )
} 