import React, { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Vector3 } from "three";
import { useAgentConnection } from "../core/AgentConnection";

interface AgentProps {
  id: string;
  model?: ReactNode;
  onStateChange?: (state: any) => void;
}

export function Agent({ id, model, onStateChange }: AgentProps) {
  const meshRef = useRef<Mesh>(null);
  const agents = useAgentConnection((state) => state.agents);
  const sendMessage = useAgentConnection((state) => state.sendMessage);

  useEffect(() => {
    const agentState = agents.get(id);
    if (agentState && onStateChange) {
      onStateChange(agentState);
    }
  }, [agents, id, onStateChange]);

  useFrame(() => {
    if (!meshRef.current) return;

    const agentState = agents.get(id);
    if (agentState) {
      const targetPosition = new Vector3(...agentState.position);
      meshRef.current.position.lerp(targetPosition, 0.1);

      meshRef.current.rotation.x = agentState.rotation[0];
      meshRef.current.rotation.y = agentState.rotation[1];
      meshRef.current.rotation.z = agentState.rotation[2];
    }
  });

  return (
    <mesh
      ref={meshRef}
      onClick={() => {
        sendMessage({
          type: "action",
          agentId: id,
          data: { action: "click" },
        });
      }}
    >
      {model || (
        <group>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="blue" />
        </group>
      )}
    </mesh>
  );
}
