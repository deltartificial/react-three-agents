import { App, WebSocket, TemplatedApp } from "uWebSockets.js";
import type { AgentMessage, AgentState } from "../core/AgentConnection";

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
  private app: TemplatedApp;
  private connections: Map<string, WebSocketConnection>;
  private agents: Map<string, AgentState>;
  private port: number;
  private isRunning: boolean = false;
  private onAgentAction?: (action: AgentAction) => void;

  constructor(port: number = 8765) {
    this.port = port;
    this.connections = new Map();
    this.agents = new Map();
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
      },
      close: (ws: WebSocket) => {
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
      },
    });
  }

  public start(): boolean {
    let success = false;
    this.app.listen(this.port, (listenSocket: boolean) => {
      if (listenSocket) {
        console.log(`WebSocket server is running on port ${this.port}`);
        this.isRunning = true;
        success = true;
      } else {
        console.error(`Failed to start WebSocket server on port ${this.port}`);
        this.isRunning = false;
        success = false;
      }
    });
    return success;
  }

  public stop() {
    if (this.isRunning) {
      this.app.close();
      this.isRunning = false;
      console.log("WebSocket server stopped");
    }
  }

  public broadcast(message: AgentMessage, exclude?: WebSocket) {
    const messageStr = JSON.stringify(message);
    this.connections.forEach(({ ws }) => {
      if (ws !== exclude) {
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
      ws.send(JSON.stringify(message));
      return true;
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

    this.broadcast({
      type: "state",
      agentId,
      data: newState,
    });

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
