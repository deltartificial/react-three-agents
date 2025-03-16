import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useAgentConnection } from "../core/AgentConnection";
import { AgentWebSocketServer } from "../server/WebSocketServer";
import type { AgentAction } from "../server/WebSocketServer";

interface EnvironmentProps {
  serverUrl?: string;
  serverPort?: number;
  startServer?: boolean;
  children?: ReactNode;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onAgentAction?: (action: AgentAction) => void;
  noCanvas?: boolean;
  canvasProps?: Record<string, any>;
}

// Singleton server instance
let serverInstance: AgentWebSocketServer | null = null;

export function Environment({
  serverUrl = "ws://localhost:8765",
  serverPort = 8765,
  startServer = true,
  children,
  onConnect,
  onDisconnect,
  onAgentAction,
  noCanvas = false,
  canvasProps = {},
}: EnvironmentProps) {
  const connect = useAgentConnection((state) => state.connect);
  const disconnect = useAgentConnection((state) => state.disconnect);
  const connected = useAgentConnection((state) => state.connected);
  const [serverStarted, setServerStarted] = useState(false);

  // Start server if needed
  useEffect(() => {
    if (startServer && !serverInstance) {
      serverInstance = new AgentWebSocketServer(serverPort);

      if (onAgentAction) {
        serverInstance.onAction(onAgentAction);
      }

      const success = serverInstance.start();
      setServerStarted(success);

      return () => {
        if (serverInstance) {
          serverInstance.stop();
          serverInstance = null;
        }
      };
    }
  }, [startServer, serverPort, onAgentAction]);

  // Connect to server
  useEffect(() => {
    // Only connect if we're not starting our own server or if our server has started
    if (!startServer || serverStarted) {
      connect(serverUrl);
    }

    return () => disconnect();
  }, [serverUrl, connect, disconnect, startServer, serverStarted]);

  // Handle connection status
  useEffect(() => {
    if (connected) {
      onConnect?.();
    } else {
      onDisconnect?.();
    }
  }, [connected, onConnect, onDisconnect]);

  // If noCanvas is true, just return the children
  if (noCanvas) {
    return <>{children}</>;
  }

  // Otherwise, wrap in Canvas with default or custom props
  return (
    <Canvas {...canvasProps}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />
      {children}
    </Canvas>
  );
}

// Export the server instance getter for advanced usage
export function getServerInstance(): AgentWebSocketServer | null {
  return serverInstance;
}
