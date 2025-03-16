import React, { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Vector3, Group } from "three";
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
}: AgentProps) {
  const groupRef = useRef<Group>(null);
  const agents = useAgentConnection((state) => state.agents);
  const sendMessage = useAgentConnection((state) => state.sendMessage);
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    const agentState = agents.get(id);
    if (agentState) {
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

    const agentState = agents.get(id);
    if (agentState) {
      const targetPosition = new Vector3(...agentState.position);
      groupRef.current.position.lerp(targetPosition, smoothing);

      // Apply rotation with smoothing
      const targetRotationX = agentState.rotation[0];
      const targetRotationY = agentState.rotation[1];
      const targetRotationZ = agentState.rotation[2];

      groupRef.current.rotation.x +=
        (targetRotationX - groupRef.current.rotation.x) * smoothing;
      groupRef.current.rotation.y +=
        (targetRotationY - groupRef.current.rotation.y) * smoothing;
      groupRef.current.rotation.z +=
        (targetRotationZ - groupRef.current.rotation.z) * smoothing;
    }
  });

  const handleClick = () => {
    sendMessage({
      type: "action",
      agentId: id,
      data: { action: "click" },
    });
  };

  return (
    <group ref={groupRef}>
      <mesh onClick={handleClick}>
        {model || (
          <>
            <boxGeometry args={[size, size, size]} />
            <meshStandardMaterial color={color} />
          </>
        )}
      </mesh>

      {showLabel && (
        <Html
          position={[0, size + 0.5, 0]}
          center
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            color: "white",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "12px",
            pointerEvents: "none",
          }}
        >
          {label}
        </Html>
      )}
    </group>
  );
}
