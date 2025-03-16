import { create } from "zustand";

export interface AgentState {
  position: [number, number, number];
  rotation: [number, number, number];
  action: string;
  reward: number;
  done: boolean;
}

export interface AgentMessage {
  type: "state" | "action" | "reset" | "info";
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
}

export const useAgentConnection = create<ConnectionStore>((set, get) => ({
  socket: null,
  connected: false,
  agents: new Map(),

  connect: (url: string) => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      set({ connected: true });
    };

    socket.onmessage = (event) => {
      try {
        const message: AgentMessage = JSON.parse(event.data);
        get().updateAgentState(message.agentId, message.data);
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    socket.onclose = () => {
      set({ connected: false });
    };

    set({ socket });
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
