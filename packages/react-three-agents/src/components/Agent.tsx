import React, { useEffect, useRef, useState, useMemo } from "react";
import type { ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Group, Object3D } from "three";
import { useAgentConnection } from "../core/AgentConnection";
import { Html } from "@react-three/drei";

interface AgentProps {
  id: string;
  model?: ReactNode;
  onStateChange?: (state: any) => void;
  color?: string;
  size?: number;
  showLabel?: boolean;
  labelContent?: string | ((state: any) => string);
  smoothing?: number;
  onClick?: (id: string, state: any) => void;
  initialPosition?: [number, number, number];
  initialRotation?: [number, number, number];
  frustumCulled?: boolean;
  labelStyle?: React.CSSProperties;
}

export function Agent({
  id,
  model,
  onStateChange,
  color = "blue",
  size = 1,
  showLabel = false,
  labelContent,
  smoothing = 0.1,
  onClick,
  initialPosition = [0, 0, 0],
  initialRotation = [0, 0, 0],
  frustumCulled = true,
  labelStyle,
}: AgentProps) {
  const groupRef = useRef<Group>(null);
  const targetPosition = useRef<Vector3>(new Vector3(...initialPosition));
  const targetRotation = useRef<[number, number, number]>([...initialRotation]);
  const agents = useAgentConnection((state) => state.agents);
  const sendMessage = useAgentConnection((state) => state.sendMessage);
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...initialPosition);
      groupRef.current.rotation.set(...initialRotation);
    }
  }, [initialPosition, initialRotation]);

  useEffect(() => {
    const agentState = agents.get(id);
    if (agentState) {
      targetPosition.current = new Vector3(...agentState.position);
      targetRotation.current = [...agentState.rotation];

      if (onStateChange) {
        onStateChange(agentState);
      }

      if (showLabel) {
        if (typeof labelContent === "function") {
          setLabel(labelContent(agentState));
        } else if (labelContent) {
          setLabel(labelContent);
        } else {
          setLabel(`Agent ${id}`);
        }
      }
    }
  }, [agents, id, onStateChange, showLabel, labelContent]);

  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.position.lerp(targetPosition.current, smoothing);

    groupRef.current.rotation.x +=
      (targetRotation.current[0] - groupRef.current.rotation.x) * smoothing;
    groupRef.current.rotation.y +=
      (targetRotation.current[1] - groupRef.current.rotation.y) * smoothing;
    groupRef.current.rotation.z +=
      (targetRotation.current[2] - groupRef.current.rotation.z) * smoothing;
  });

  const handleClick = (event: any) => {
    event.stopPropagation();
    
    sendMessage({
      type: "action",
      agentId: id,
      data: { action: "click" },
    });
    
    if (onClick) {
      onClick(id, agents.get(id) || {});
    }
  };

  const defaultModel = useMemo(() => (
    <>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color={color} />
    </>
  ), [size, color]);

  const mergedLabelStyle = useMemo(() => ({
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "white",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "12px",
    pointerEvents: "none" as const,
    ...labelStyle
  }), [labelStyle]);

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
  );
}
