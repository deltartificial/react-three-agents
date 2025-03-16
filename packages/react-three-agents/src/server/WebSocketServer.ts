import { App, WebSocket, TemplatedApp } from "uWebSockets.js";
import type { AgentMessage } from "../core/AgentConnection";

interface WebSocketConnection {
  ws: WebSocket;
  id: string;
}

export class AgentWebSocketServer {
  private app: TemplatedApp;
  private connections: Map<string, WebSocketConnection>;
  private port: number;
  private onMessage?: (message: AgentMessage) => void;

  constructor(port: number = 8765) {
    this.port = port;
    this.connections = new Map();
    this.app = App();

    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.app.ws("/*", {
      open: (ws: WebSocket) => {
        const id = Math.random().toString(36).substring(7);
        this.connections.set(id, { ws, id });
        console.log(`Client connected: ${id}`);
      },
      message: (ws: WebSocket, message: ArrayBuffer) => {
        try {
          const data = JSON.parse(
            new TextDecoder().decode(message)
          ) as AgentMessage;
          if (this.onMessage) {
            this.onMessage(data);
          }
          // Broadcast message to all clients except sender
          this.broadcast(data, ws);
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      },
      close: (ws: WebSocket) => {
        const connection = Array.from(this.connections.entries()).find(
          ([_, conn]) => conn.ws === ws
        );

        if (connection) {
          const [id] = connection;
          this.connections.delete(id);
          console.log(`Client disconnected: ${id}`);
        }
      },
    });
  }

  public start() {
    this.app.listen(this.port, (listenSocket: boolean) => {
      if (listenSocket) {
        console.log(`WebSocket server is running on port ${this.port}`);
      } else {
        console.error(`Failed to start WebSocket server on port ${this.port}`);
      }
    });
  }

  public stop() {
    this.app.close();
  }

  public broadcast(message: AgentMessage, exclude?: WebSocket) {
    const messageStr = JSON.stringify(message);
    this.connections.forEach(({ ws }) => {
      if (ws !== exclude) {
        ws.send(messageStr);
      }
    });
  }

  public onMessageReceived(callback: (message: AgentMessage) => void) {
    this.onMessage = callback;
  }
}
