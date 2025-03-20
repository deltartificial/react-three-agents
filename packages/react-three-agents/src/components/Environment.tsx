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

  useEffect(() => {
    const isBrowser = typeof window !== "undefined";

    if (startServer && !serverInstance && !isBrowser) {
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
    } else if (isBrowser && startServer) {
      console.log(
        "WebSocket server can't be started in the browser. Use the standalone server instead."
      );
      setServerStarted(true);
    }
  }, [startServer, serverPort, onAgentAction]);

  useEffect(() => {
    if (!startServer || serverStarted) {
      connect(serverUrl);
    }

    return () => disconnect();
  }, [serverUrl, connect, disconnect, startServer, serverStarted]);

  useEffect(() => {
    if (connected) {
      onConnect?.();
    } else {
      onDisconnect?.();
    }
  }, [connected, onConnect, onDisconnect]);

  if (noCanvas) {
    return <>{children}</>;
  }

  return (
    <Canvas {...canvasProps}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />
      {children}
    </Canvas>
  );
}

export function getServerInstance(): AgentWebSocketServer | null {
  return serverInstance;
}
