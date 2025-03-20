import { WebSocketServer, WebSocket } from "ws";
import type { AgentMessage, AgentState } from "../core/AgentConnection";
import { IncomingMessage } from "http";
import { MessageValidator } from "../utils/MessageValidator";

interface WebSocketConnection {
  ws: WebSocket;
  id: string;
  agentId?: string;
  lastActivity: number;
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
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private validator: MessageValidator;
  private connectionTimeout = 30000; // 30 seconds timeout

  constructor(port: number = 8765) {
    this.port = port;
    this.connections = new Map();
    this.agents = new Map();
    this.validator = new MessageValidator();
  }

  private setupWebSocketServer() {
    try {
      this.server = new WebSocketServer({ port: this.port });

      this.server.on("connection", this.handleConnection.bind(this));
      this.server.on("error", this.handleServerError.bind(this));
      
      this.startHeartbeatCheck();
      
      return true;
    } catch (error) {
      console.error(`Failed to setup WebSocket server: ${error}`);
      return false;
    }
  }
  
  private handleConnection(ws: WebSocket, request: IncomingMessage) {
    const id = this.generateUniqueId();
    const connection: WebSocketConnection = { 
      ws, 
      id, 
      lastActivity: Date.now() 
    };
    
    this.connections.set(id, connection);
    console.log(`Client connected: ${id}`);

    ws.on("message", (message: any) => this.handleMessage(message, ws, connection));
    ws.on("close", () => this.handleClose(ws));
    ws.on("error", (error: Error) => this.handleConnectionError(error, connection));
    
    this.sendToConnection(connection, {
      type: "info",
      agentId: "server",
      data: { message: `Connected with ID: ${id}` }
    });
  }
  
  private generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  
  private async handleMessage(message: any, ws: WebSocket, connection: WebSocketConnection) {
    try {
      connection.lastActivity = Date.now();
      this.connections.set(connection.id, connection);
      
      const messageStr = message.toString();
      const data = JSON.parse(messageStr) as AgentMessage;
      
      const validationResult = this.validator.validate(data);
      if (!validationResult.valid) {
        this.sendToConnection(connection, {
          type: "error",
          agentId: "server",
          data: { error: `Invalid message schema: ${validationResult.errors.join(', ')}` }
        });
        return;
      }

      if (data.agentId && !connection.agentId) {
        connection.agentId = data.agentId;
        this.connections.set(connection.id, connection);
      }

      await this.processMessage(data, ws, connection);
    } catch (error) {
      console.error("Failed to process message:", error);
      this.sendToConnection(connection, {
        type: "error",
        agentId: "server",
        data: { error: `Failed to process message: ${error}` }
      });
    }
  }
  
  private async processMessage(data: AgentMessage, ws: WebSocket, connection: WebSocketConnection) {
    switch (data.type) {
      case "action":
        if (data.data && this.onAgentAction) {
          await Promise.resolve(this.onAgentAction({
            agentId: data.agentId,
            ...data.data,
          }));
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
          const newState = {
            ...currentState,
            ...data.data,
          };
          this.agents.set(data.agentId, newState);
          await this.broadcast(data, ws);
        }
        break;
        
      case "reset":
        this.agents.set(data.agentId, {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          action: "",
          reward: 0,
          done: false,
          ...data.data,
        });
        await this.broadcast(data, ws);
        break;
        
      case "info":
        this.sendToConnection(connection, {
          type: "info",
          agentId: "server",
          data: { message: "Information received" }
        });
        break;
    }
  }
  
  private handleClose(ws: WebSocket) {
    const connection = this.findConnectionByWs(ws);

    if (connection) {
      this.connections.delete(connection.id);
      console.log(`Client disconnected: ${connection.id}`);

      if (connection.agentId) {
        this.agents.delete(connection.agentId);
        this.broadcast({
          type: "info",
          agentId: "server",
          data: { agentDisconnected: connection.agentId }
        });
      }
    }
  }
  
  private handleServerError(error: Error) {
    console.error("WebSocket server error:", error);
  }
  
  private handleConnectionError(error: Error, connection: WebSocketConnection) {
    console.error(`Connection error for ${connection.id}:`, error);
  }
  
  private findConnectionByWs(ws: WebSocket): WebSocketConnection | undefined {
    for (const [_, conn] of this.connections.entries()) {
      if (conn.ws === ws) {
        return conn;
      }
    }
    return undefined;
  }
  
  private startHeartbeatCheck() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      
      this.connections.forEach((connection, id) => {
        if (now - connection.lastActivity > this.connectionTimeout) {
          console.log(`Connection ${id} timed out, closing`);
          try {
            connection.ws.close(1000, "Connection timeout");
            this.connections.delete(id);
            
            if (connection.agentId) {
              this.agents.delete(connection.agentId);
            }
          } catch (e) {
            console.error(`Error closing timed out connection ${id}:`, e);
            this.connections.delete(id);
          }
        } else {
          try {
            connection.ws.ping();
          } catch (e) {
            console.error(`Error pinging connection ${id}:`, e);
          }
        }
      });
    }, 10000);
  }
  
  private sendToConnection(connection: WebSocketConnection, message: AgentMessage) {
    try {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
        return true;
      }
    } catch (error) {
      console.error(`Error sending message to connection ${connection.id}:`, error);
    }
    return false;
  }

  public start(): boolean {
    try {
      const result = this.setupWebSocketServer();
      this.isRunning = result;
      
      if (result) {
        console.log(`WebSocket server is running on port ${this.port}`);
      }
      
      return result;
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
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      
      this.connections.forEach(({ ws }) => {
        try {
          ws.close(1000, "Server shutting down");
        } catch (e) {
          console.error("Error closing connection:", e);
        }
      });

      this.server.close((err?: Error) => {
        if (err) {
          console.error("Error closing WebSocket server:", err);
        } else {
          console.log("WebSocket server closed successfully");
        }
      });

      this.connections.clear();
      this.agents.clear();
      this.server = null;

      this.isRunning = false;
      console.log("WebSocket server stopped");
    }
  }

  public async broadcast(message: AgentMessage, exclude?: WebSocket) {
    const messageStr = JSON.stringify(message);
    const promises: Promise<void>[] = [];
    
    this.connections.forEach(({ ws }) => {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        promises.push(
          new Promise<void>((resolve) => {
            ws.send(messageStr, (error) => {
              if (error) {
                console.error("Error broadcasting message:", error);
              }
              resolve();
            });
          })
        );
      }
    });
    
    await Promise.all(promises);
  }

  public sendToAgent(agentId: string, message: AgentMessage): boolean {
    for (const [_, connection] of this.connections.entries()) {
      if (connection.agentId === agentId) {
        return this.sendToConnection(connection, message);
      }
    }
    return false;
  }

  public async updateAgentState(agentId: string, state: Partial<AgentState>) {
    const currentState = this.agents.get(agentId) || {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      action: "",
      reward: 0,
      done: false,
    };

    const newState = { ...currentState, ...state };
    this.agents.set(agentId, newState);

    const stateMessage: AgentMessage = {
      type: "state",
      agentId,
      data: newState,
    };

    await this.broadcast(stateMessage);

    const sent = this.sendToAgent(agentId, stateMessage);
    if (!sent) {
      console.log(
        `Could not send state update directly to agent ${agentId}. It might not be connected.`
      );
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
  
  public setConnectionTimeout(ms: number) {
    this.connectionTimeout = ms;
  }
  
  public getConnectedAgents(): string[] {
    const agents = [];
    for (const [_, connection] of this.connections.entries()) {
      if (connection.agentId) {
        agents.push(connection.agentId);
      }
    }
    return agents;
  }
}
