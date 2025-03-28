import React, { useEffect, useState, useCallback } from "react";
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
  onError?: (error: string) => void;
  onAgentAction?: (action: AgentAction) => void;
  noCanvas?: boolean;
  canvasProps?: Record<string, any>;
  secure?: boolean;
  serverTimeout?: number;
}

let serverInstance: AgentWebSocketServer | null = null;

export function Environment({
  serverUrl,
  serverPort = 8765,
  startServer = true,
  children,
  onConnect,
  onDisconnect,
  onError,
  onAgentAction,
  noCanvas = false,
  canvasProps = {},
  secure = false,
  serverTimeout = 30000,
}: EnvironmentProps) {
  const connect = useAgentConnection((state) => state.connect);
  const disconnect = useAgentConnection((state) => state.disconnect);
  const connected = useAgentConnection((state) => state.connected);
  const [serverStarted, setServerStarted] = useState(false);
  const [connectionUrl, setConnectionUrl] = useState<string | null>(null);

  // Update URL if secure option changes
  useEffect(() => {
    const protocol = secure ? "wss" : "ws";
    const calculatedUrl = serverUrl || `${protocol}://localhost:${serverPort}`;
    setConnectionUrl(calculatedUrl);
  }, [serverUrl, serverPort, secure]);

  // Set up error handler
  useEffect(() => {
    if (onError) {
      const store = useAgentConnection.getState();
      // @ts-ignore - onError is defined in our updated store
      store.onError = onError;
    }
  }, [onError]);

  // Start server if needed
  useEffect(() => {
    const isBrowser = typeof window !== "undefined";

    if (startServer && !serverInstance && !isBrowser) {
      try {
        serverInstance = new AgentWebSocketServer(serverPort);

        if (onAgentAction) {
          serverInstance.onAction(onAgentAction);
        }

        if (serverTimeout) {
          serverInstance.setConnectionTimeout(serverTimeout);
        }

        const success = serverInstance.start();
        setServerStarted(success);

        if (!success && onError) {
          onError(`Failed to start WebSocket server on port ${serverPort}`);
        }

        return () => {
          if (serverInstance) {
            serverInstance.stop();
            serverInstance = null;
          }
        };
      } catch (error) {
        console.error("Error starting WebSocket server:", error);
        if (onError) {
          onError(`Error starting WebSocket server: ${error}`);
        }
        setServerStarted(false);
      }
    } else if (isBrowser && startServer) {
      console.log(
        "WebSocket server can't be started in the browser. Use the standalone server instead."
      );
      setServerStarted(true);
    }
  }, [startServer, serverPort, onAgentAction, onError, serverTimeout]);

  // Connect to the server when ready
  useEffect(() => {
    if ((!startServer || serverStarted) && connectionUrl) {
      connect(connectionUrl);
    }

    return () => disconnect();
  }, [connectionUrl, connect, disconnect, startServer, serverStarted]);

  // Handle connection status changes
  useEffect(() => {
    if (connected) {
      onConnect?.();
    } else {
      onDisconnect?.();
    }
  }, [connected, onConnect, onDisconnect]);

  const getAgents = useCallback(() => {
    if (serverInstance) {
      return serverInstance.getConnectedAgents();
    }
    return [];
  }, []);

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

export function getConnectedAgents(): string[] {
  if (serverInstance) {
    return serverInstance.getConnectedAgents();
  }
  return [];
}
