// Server script to run the WebSocket server for R3F Agents
import { AgentWebSocketServer } from "../packages/react-three-agents/dist/server/WebSocketServer.js";

const PORT = 8765;

// Create and start the WebSocket server
console.log(`Starting R3F Agents WebSocket server on port ${PORT}...`);
const server = new AgentWebSocketServer(PORT);

// Handle agent actions
server.onAction((action) => {
  console.log(`Received action from agent ${action.agentId}:`, action);

  // Get the current state of the agent
  const currentState = server.getAgentState(action.agentId) || {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    reward: 0,
    done: false,
    action: "",
  };

  // Update the agent state with the new position from the action
  const newPosition = action.position || currentState.position;

  // Update the agent state with a small reward
  const newState = {
    ...currentState,
    position: newPosition,
    reward: 0.1, // Simple reward for taking an action
  };

  console.log(`Updating state for agent ${action.agentId}:`, newState);
  server.updateAgentState(action.agentId, newState);
});

// Start the server
const success = server.start();

if (success) {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log("Press Ctrl+C to stop");
} else {
  console.error(`Failed to start WebSocket server on port ${PORT}`);
  process.exit(1);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  server.stop();
  process.exit(0);
});
