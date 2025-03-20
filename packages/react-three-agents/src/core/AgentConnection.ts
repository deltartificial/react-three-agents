import { create } from "zustand";
import { useConnectionStore } from './connection/connection.store'

export interface AgentState {
  position: [number, number, number];
  rotation: [number, number, number];
  action: string;
  reward: number;
  done: boolean;
  message?: string;
  error?: string;
  agentDisconnected?: string;
  [key: string]: any; // Allow for custom properties
}

export interface AgentMessage {
  type: "state" | "action" | "reset" | "info" | "error";
  agentId: string;
  data: Partial<AgentState>;
}

interface ConnectionStore {
  socket: WebSocket | null;
  connected: boolean;
  agents: Map<string, AgentState>;
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (message: AgentMessage) => void;
  updateAgentState: (agentId: string, state: Partial<AgentState>) => void;
  onError?: (error: string) => void;
}

export const useAgentConnection = create<ConnectionStore>((set, get) => ({
  socket: null,
  connected: false,
  agents: new Map(),
  onError: undefined,

  connect: (url: string) => {
    return new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(url);

        socket.onopen = () => {
          set({ connected: true });
          const store = get();
          if (store && store.onConnect) {
            store.onConnect(url);
          }
          resolve();
        };

        socket.onmessage = (event) => {
          try {
            const message: AgentMessage = JSON.parse(event.data);
            const store = get();
            
            if (message.type === "error" && message.data.error && store && store.onError) {
              store.onError(message.data.error);
              return;
            }

            if (store && store.onMessage) {
              store.onMessage(message);
            }
          } catch (error) {
            const store = get();
            if (store && store.onError) {
              store.onError("Failed to parse message");
            }
          }
        };

        socket.onclose = () => {
          set({ connected: false });
          const store = get();
          if (store && store.onDisconnect) {
            store.onDisconnect(url);
          }
        };

        socket.onerror = () => {
          const store = get();
          if (store && store.onError) {
            store.onError("WebSocket connection error");
          }
        };

        set({ socket });
      } catch (error) {
        const store = get();
        if (store && store.onError) {
          store.onError(`Failed to connect: ${error}`);
        }
        reject(error);
      }
    });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, connected: false });
    }
  },

  sendMessage: (message: AgentMessage) => {
    const { socket, connected } = get();
    if (socket && connected) {
      socket.send(JSON.stringify(message));
    } else if (get().onError) {
      get().onError("Cannot send message: not connected");
    }
  },

  updateAgentState: (agentId: string, state: Partial<AgentState>) => {
    set((store) => {
      const agents = new Map(store.agents);
      const currentState = agents.get(agentId) || {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        action: "",
        reward: 0,
        done: false,
      };
      agents.set(agentId, { ...currentState, ...state });
      return { agents };
    });
  },
}));

export class AgentConnection {
  private socket: WebSocket | null = null
  private get = useConnectionStore.getState

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url)

        this.socket.onopen = () => {
          const store = this.get()
          if (store && store.onConnect) {
            store.onConnect(url)
          }
          resolve()
        }

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            const store = this.get()
            
            if (message.type === 'error' && store && store.onError) {
              store.onError(message.data.error)
              return
            }

            if (store && store.onMessage) {
              store.onMessage(message)
            }
          } catch (error) {
            const store = this.get()
            if (store && store.onError) {
              store.onError('Failed to parse message')
            }
          }
        }

        this.socket.onerror = () => {
          const store = this.get()
          if (store && store.onError) {
            store.onError('WebSocket connection error')
          }
        }

        this.socket.onclose = () => {
          const store = this.get()
          if (store && store.onDisconnect) {
            store.onDisconnect(url)
          }
        }
      } catch (error) {
        const store = this.get()
        if (store && store.onError) {
          store.onError(`Failed to connect: ${error}`)
        }
        reject(error)
      }
    })
  }

  send(message: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      const store = this.get()
      if (store && store.onError) {
        store.onError('Cannot send message: not connected')
      }
      return
    }

    try {
      this.socket.send(JSON.stringify(message))
    } catch (error) {
      const store = this.get()
      if (store && store.onError) {
        store.onError('Failed to send message')
      }
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }
}
