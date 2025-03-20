import { create } from "zustand";

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
    try {
      const socket = new WebSocket(url);

      socket.onopen = () => {
        set({ connected: true });
      };

      socket.onmessage = (event) => {
        try {
          const message: AgentMessage = JSON.parse(event.data);
          
          if (message.type === "error" && message.data.error && get().onError) {
            get().onError(message.data.error);
          } else if (message.type === "info" && message.data.agentDisconnected) {
            const agents = new Map(get().agents);
            agents.delete(message.data.agentDisconnected);
            set({ agents });
          } else {
            get().updateAgentState(message.agentId, message.data);
          }
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      };

      socket.onclose = () => {
        set({ connected: false });
      };

      socket.onerror = (event) => {
        console.error("WebSocket error:", event);
        if (get().onError) {
          get().onError("WebSocket connection error");
        }
      };

      set({ socket });
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      if (get().onError) {
        get().onError(`Failed to connect: ${error}`);
      }
    }
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
