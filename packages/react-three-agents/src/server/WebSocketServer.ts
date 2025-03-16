import { WebSocketServer, WebSocket } from "ws";
import type { AgentMessage, AgentState } from "../core/AgentConnection";
import { IncomingMessage } from "http";

interface WebSocketConnection {
  ws: WebSocket;
  id: string;
  agentId?: string;
}

export interface AgentAction {
  agentId: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  action?: string;
}

export class AgentWebSocketServer {
  private server: WebSocketServer | null = null;
  private connections: Map<string, WebSocketConnection>;
  private agents: Map<string, AgentState>;
  private port: number;
  private isRunning: boolean = false;
  private onAgentAction?: (action: AgentAction) => void;

  constructor(port: number = 8765) {
    this.port = port;
    this.connections = new Map();
    this.agents = new Map();
  }

  private setupWebSocketServer() {
    this.server = new WebSocketServer({ port: this.port });

    this.server.on("connection", (ws: WebSocket, request: IncomingMessage) => {
      const id = Math.random().toString(36).substring(7);
      this.connections.set(id, { ws, id });
      console.log(`Client connected: ${id}`);

      ws.on("message", (message: any) => {
        try {
          const data = JSON.parse(message.toString()) as AgentMessage;

          // Register agent ID with connection
          const connection = Array.from(this.connections.entries()).find(
            ([_, conn]) => conn.ws === ws
          );

          if (connection) {
            const [id, conn] = connection;
            if (data.agentId && !conn.agentId) {
              conn.agentId = data.agentId;
              this.connections.set(id, conn);
            }
          }

          // Handle different message types
          switch (data.type) {
            case "action":
              if (data.data && this.onAgentAction) {
                this.onAgentAction({
                  agentId: data.agentId,
                  ...data.data,
                });
              }
              break;
            case "state":
              if (data.data) {
                const currentState = this.agents.get(data.agentId) || {
                  position: [0, 0, 0],
                  rotation: [0, 0, 0],
                  action: "",
                  reward: 0,
                  done: false,
                };
                this.agents.set(data.agentId, {
                  ...currentState,
                  ...data.data,
                });
                this.broadcast(data, ws);
              }
              break;
            case "reset":
              // Reset agent state
              this.agents.set(data.agentId, {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                action: "",
                reward: 0,
                done: false,
                ...data.data,
              });
              this.broadcast(data, ws);
              break;
          }
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      });

      ws.on("close", () => {
        const connection = Array.from(this.connections.entries()).find(
          ([_, conn]) => conn.ws === ws
        );

        if (connection) {
          const [id, conn] = connection;
          this.connections.delete(id);
          console.log(`Client disconnected: ${id}`);

          // Clean up agent if this was an agent connection
          if (conn.agentId) {
            this.agents.delete(conn.agentId);
          }
        }
      });
    });

    this.server.on("error", (error: any) => {
      console.error("WebSocket server error:", error);
    });
  }

  public start(): boolean {
    try {
      this.setupWebSocketServer();
      this.isRunning = true;
      console.log(`WebSocket server is running on port ${this.port}`);
      return true;
    } catch (error) {
      console.error(
        `Failed to start WebSocket server on port ${this.port}:`,
        error
      );
      this.isRunning = false;
      return false;
    }
  }

  public stop() {
    if (this.isRunning && this.server) {
      // Close all connections
      this.connections.forEach(({ ws }) => {
        try {
          ws.close();
        } catch (e) {
          console.error("Error closing connection:", e);
        }
      });

      // Close the server
      this.server.close((err?: Error) => {
        if (err) {
          console.error("Error closing WebSocket server:", err);
        } else {
          console.log("WebSocket server closed successfully");
        }
      });

      // Clear collections
      this.connections.clear();
      this.agents.clear();
      this.server = null;

      // Mark as stopped
      this.isRunning = false;
      console.log("WebSocket server stopped");
    }
  }

  public broadcast(message: AgentMessage, exclude?: WebSocket) {
    const messageStr = JSON.stringify(message);
    this.connections.forEach(({ ws }) => {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  public sendToAgent(agentId: string, message: AgentMessage) {
    const connection = Array.from(this.connections.entries()).find(
      ([_, conn]) => conn.agentId === agentId
    );

    if (connection) {
      const [_, { ws }] = connection;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
      }
    }
    return false;
  }

  public updateAgentState(agentId: string, state: Partial<AgentState>) {
    const currentState = this.agents.get(agentId) || {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      action: "",
      reward: 0,
      done: false,
    };

    const newState = { ...currentState, ...state };
    this.agents.set(agentId, newState);

    // Create the state message
    const stateMessage: AgentMessage = {
      type: "state",
      agentId,
      data: newState,
    };

    // Broadcast to all clients
    this.broadcast(stateMessage);

    // Also send directly to the specific agent to ensure it receives the update
    const sent = this.sendToAgent(agentId, stateMessage);
    if (!sent) {
      console.log(
        `Could not send state update directly to agent ${agentId}. It might not be connected.`
      );
    } else {
      console.log(`Sent state update directly to agent ${agentId}`);
    }

    return newState;
  }

  public getAgentState(agentId: string): AgentState | undefined {
    return this.agents.get(agentId);
  }

  public onAction(callback: (action: AgentAction) => void) {
    this.onAgentAction = callback;
  }

  public isServerRunning(): boolean {
    return this.isRunning;
  }
}
