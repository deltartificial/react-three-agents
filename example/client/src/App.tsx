import React, { useEffect, useState } from "react";
import { Environment, Agent, AgentState } from "react-three-agents";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Bvh } from "@react-three/drei";
import "./App.css";
import Experience from "./components/Experience";
import { Leva } from "leva";

export function App() {
  const [agentState, setAgentState] = useState<AgentState | null>(null);

  useEffect(() => {
    // Log connection status
    const handleConnect = () => console.log("Connected to RL agent");
    const handleDisconnect = () => console.log("Disconnected from RL agent");

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a" }}>
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          zIndex: 100,
        }}
      >
        {agentState && (
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
          </>
        )}
      </div>

      <Leva collapsed />
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

      <Environment
        serverUrl="ws://localhost:8765"
        onConnect={() => console.log("Connected to RL server")}
        onDisconnect={() => console.log("Disconnected from RL server")}
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
  );
}
