import React, { useEffect } from "react";
import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useAgentConnection } from "../core/AgentConnection";

interface EnvironmentProps {
  serverUrl: string;
  children?: ReactNode;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function Environment({
  serverUrl,
  children,
  onConnect,
  onDisconnect,
}: EnvironmentProps) {
  const connect = useAgentConnection((state) => state.connect);
  const disconnect = useAgentConnection((state) => state.disconnect);
  const connected = useAgentConnection((state) => state.connected);

  useEffect(() => {
    connect(serverUrl);
    return () => disconnect();
  }, [serverUrl]);

  useEffect(() => {
    if (connected) {
      onConnect?.();
    } else {
      onDisconnect?.();
    }
  }, [connected, onConnect, onDisconnect]);

  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />
      {children}
    </Canvas>
  );
}
