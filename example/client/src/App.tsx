import React, { useEffect, useState } from "react";
import {
  Environment,
  Agent,
  AgentState,
  AgentAction,
} from "../../../packages/react-three-agents/src";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Bvh } from "@react-three/drei";
import "./App.css";
import Experience from "./components/Experience";
import { Leva } from "leva";

export function App() {
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [serverStarted, setServerStarted] = useState(false);

  // Handle agent actions
  const handleAgentAction = (action: AgentAction) => {
    console.log("Agent action received:", action);
    // You can implement custom logic here to process agent actions
  };

  useEffect(() => {
    // Log connection status
    const handleConnect = () => {
      console.log("Connected to RL agent");
      setServerStarted(true);
    };

    const handleDisconnect = () => {
      console.log("Disconnected from RL agent");
      setServerStarted(false);
    };

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a" }}>
      {/* Status indicator */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          padding: "5px 10px",
          borderRadius: "4px",
          backgroundColor: serverStarted ? "#4CAF50" : "#F44336",
          color: "white",
          zIndex: 100,
        }}
      >
        {serverStarted ? "Server Connected" : "Server Disconnected"}
      </div>

      {/* Agent state display */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: "10px",
          borderRadius: "4px",
        }}
      >
        <h3>Agent State</h3>
        {agentState ? (
          <>
            <div>
              Position: [
              {agentState.position.map((p: number) => p.toFixed(2)).join(", ")}]
            </div>
            <div>
              Rotation: [
              {agentState.rotation.map((r: number) => r.toFixed(2)).join(", ")}]
            </div>
            <div>Reward: {agentState.reward.toFixed(2)}</div>
            <div>Action: {agentState.action || "none"}</div>
            <div>Done: {agentState.done ? "Yes" : "No"}</div>
          </>
        ) : (
          <div>Waiting for agent data...</div>
        )}
      </div>

      <Leva collapsed />

      {/* Main scene */}
      <div style={{ position: "absolute", width: "100%", height: "100%" }}>
        <Canvas
          shadows
          camera={{
            fov: 65,
            near: 0.1,
            far: 1000,
          }}
          onPointerDown={(e) => {
            if (e.pointerType === "mouse") {
              (e.target as HTMLCanvasElement).requestPointerLock();
            }
          }}
        >
          <Suspense fallback={null}>
            <Bvh firstHitOnly>
              <Experience />
            </Bvh>
          </Suspense>
        </Canvas>
      </div>

      {/* Agent visualization */}
      <div
        style={{
          position: "absolute",
          width: "30%",
          height: "30%",
          bottom: 20,
          right: 20,
          border: "1px solid #444",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <Environment
          serverUrl="ws://localhost:8765"
          startServer={true}
          serverPort={8765}
          onConnect={() => console.log("Connected to RL server")}
          onDisconnect={() => console.log("Disconnected from RL server")}
          onAgentAction={handleAgentAction}
        >
          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#303030" />
          </mesh>

          {/* Grid helper */}
          <gridHelper args={[20, 20, "#666666", "#444444"]} />

          {/* Agent */}
          <Agent id="main" onStateChange={setAgentState} />
        </Environment>
      </div>
    </div>
  );
}
