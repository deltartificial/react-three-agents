import React, { useEffect, useState, useRef } from "react";
import {
  Environment,
  Agent,
  AgentState,
  AgentAction,
  getServerInstance,
} from "../../../packages/react-three-agents/src";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Bvh, OrbitControls, Stats } from "@react-three/drei";
import "./App.css";
import Experience from "./components/Experience";
import { Leva, useControls } from "leva";

function AppComponent() {
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [serverStarted, setServerStarted] = useState(false);
  const [agentHistory, setAgentHistory] = useState<
    Array<[number, number, number]>
  >([]);
  const historyLimit = 100;
  const frameCounter = useRef(0);
  const [showStats, setShowStats] = useState(false);

  const { showTrail, trailColor, showMainScene, showAgentView } = useControls({
    showTrail: { value: true, label: "Show Agent Trail" },
    trailColor: { value: "#00a0ff", label: "Trail Color" },
    showMainScene: { value: true, label: "Show Main Scene" },
    showAgentView: { value: true, label: "Show Agent View" },
  });

  const handleAgentAction = (action: AgentAction) => {
    const server = getServerInstance();
    if (server && action.agentId) {
      const currentState = server.getAgentState(action.agentId);
      if (currentState) {
        server.updateAgentState(action.agentId, {
          ...currentState,
          reward: Math.random() * 0.2,
        });
      }
    }
  };

  useEffect(() => {
    const handleConnect = () => {
      setServerStarted(true);
    };

    const handleDisconnect = () => {
      setServerStarted(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s") {
        setShowStats((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (agentState && agentState.position) {
      frameCounter.current += 1;

      if (frameCounter.current % 5 === 0) {
        setAgentHistory((prev) => {
          const newHistory = [
            ...prev,
            [...agentState.position] as [number, number, number],
          ];
          if (newHistory.length > historyLimit) {
            return newHistory.slice(newHistory.length - historyLimit);
          }
          return newHistory;
        });
      }
    }
  }, [agentState]);

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
          maxWidth: "300px",
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
            <div>Reward: {agentState.reward.toFixed(4)}</div>
            <div>Action: {agentState.action || "none"}</div>
            <div>Done: {agentState.done ? "Yes" : "No"}</div>
          </>
        ) : (
          <div>Waiting for agent data...</div>
        )}
        <div style={{ marginTop: "10px", fontSize: "12px" }}>
          Press 'S' to toggle stats
        </div>
      </div>

      <Leva collapsed />

      {/* Initialize the Environment with WebSocket server */}
      <Environment
        serverUrl="ws://localhost:8765"
        startServer={false}
        serverPort={8765}
        onConnect={() => setServerStarted(true)}
        onDisconnect={() => setServerStarted(false)}
        onAgentAction={handleAgentAction}
        noCanvas={true} // Don't wrap in Canvas
      />

      {showMainScene && (
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
            {showStats && <Stats />}
            <Suspense fallback={null}>
              <Bvh firstHitOnly>
                <Experience />
              </Bvh>
            </Suspense>
          </Canvas>
        </div>
      )}

      {showAgentView && (
        <div
          style={{
            position: "absolute",
            width: showMainScene ? "30%" : "100%",
            height: showMainScene ? "30%" : "100%",
            bottom: showMainScene ? 20 : 0,
            right: showMainScene ? 20 : 0,
            border: showMainScene ? "1px solid #444" : "none",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <Canvas shadows>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, -0.5, 0]}
              receiveShadow
            >
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#303030" />
            </mesh>

            <gridHelper args={[50, 50, "#666666", "#444444"]} />

            {showTrail && agentHistory.length > 1 && (
              <line>
                <bufferGeometry attach="geometry">
                  <bufferAttribute
                    attach="attributes-position"
                    count={agentHistory.length}
                    array={new Float32Array(agentHistory.flat())}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial
                  attach="material"
                  color={trailColor}
                  linewidth={2}
                />
              </line>
            )}

            <Agent
              id="main"
              onStateChange={setAgentState}
              color={trailColor}
              size={1.2}
              showLabel={true}
              labelContent={(state) => `Reward: ${state.reward.toFixed(2)}`}
              smoothing={0.15}
            />

            <OrbitControls />
          </Canvas>
        </div>
      )}
    </div>
  );
}

export default AppComponent;
