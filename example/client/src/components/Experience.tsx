import { Grid, KeyboardControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { Physics } from "@react-three/rapier";
import Floor from "./Floor";
import Lights from "./Lights";
import Steps from "./Steps";
import Slopes from "./Slopes";
import RoughPlane from "./RoughPlane";
import RigidObjects from "./RigidObjects";
import FloatingPlatform from "./FloatingPlatform";
import DynamicPlatforms from "./DynamicPlatforms";
import { useControls } from "leva";
import { useEffect, useState, useRef } from "react";
import CharacterModel from "./CharacterModel";
import { Agent, AgentState } from "../../../../packages/react-three-agents/src";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Define marker components for start and target positions
const StartMarker = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
        <meshStandardMaterial color="green" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="lightgreen"
          emissive="green"
          emissiveIntensity={0.5}
        />
      </mesh>
      <pointLight
        position={[0, 1.5, 0]}
        color="green"
        intensity={1}
        distance={3}
      />
    </group>
  );
};

const TargetMarker = ({ position }: { position: [number, number, number] }) => {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position} ref={ref}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
        <meshStandardMaterial color="red" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <torusGeometry args={[0.5, 0.2, 16, 32]} />
        <meshStandardMaterial
          color="orange"
          emissive="red"
          emissiveIntensity={0.5}
        />
      </mesh>
      <pointLight
        position={[0, 1.5, 0]}
        color="red"
        intensity={1}
        distance={3}
      />
    </group>
  );
};

// Path visualization component
const AgentPath = ({
  positions,
  color = "#00a0ff",
}: {
  positions: Array<[number, number, number]>;
  color?: string;
}) => {
  if (positions.length < 2) return null;

  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={positions.length}
          array={new Float32Array(positions.flat())}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial attach="material" color={color} linewidth={2} />
    </line>
  );
};

export default function Experience() {
  const [pausedPhysics, setPausedPhysics] = useState(true);
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [agentHistory, setAgentHistory] = useState<
    Array<[number, number, number]>
  >([]);
  const historyLimit = 100;
  const frameCounter = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPausedPhysics(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  const {
    physics,
    disableControl,
    disableFollowCam,
    showAgentPath,
    startPosition,
    targetPosition,
  } = useControls("World Settings", {
    physics: false,
    disableControl: false,
    disableFollowCam: false,
    showAgentPath: true,
    startPosition: {
      value: [0, 0, 0],
      step: 1,
    },
    targetPosition: {
      value: [10, 0, 10],
      step: 1,
    },
  });

  // Update agent history for path visualization
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

  const keyboardMap = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
    { name: "rightward", keys: ["ArrowRight", "KeyD"] },
    { name: "jump", keys: ["Space"] },
  ];

  return (
    <KeyboardControls map={keyboardMap}>
      <Perf position="top-left" minimal />

      <Grid
        args={[300, 300]}
        sectionColor={"lightgray"}
        cellColor={"gray"}
        position={[0, -0.99, 0]}
        userData={{ camExcludeCollision: true }}
      />

      <Lights />

      <Physics debug={physics} timeStep="vary" paused={pausedPhysics}>
        <RoughPlane />

        <Slopes />

        <Steps />

        <RigidObjects />

        <FloatingPlatform />

        <DynamicPlatforms />

        <Floor />

        {/* Start and target markers */}
        <StartMarker position={startPosition as [number, number, number]} />
        <TargetMarker position={targetPosition as [number, number, number]} />

        {/* Agent path visualization */}
        {showAgentPath && agentHistory.length > 1 && (
          <AgentPath positions={agentHistory} />
        )}

        {/* Agent in the scene */}
        <Agent
          id="main"
          onStateChange={setAgentState}
          color="#00a0ff"
          size={1.2}
          showLabel={true}
          labelContent={(state) => `Reward: ${state.reward.toFixed(2)}`}
          smoothing={0.15}
        />

        <CharacterModel />
      </Physics>
    </KeyboardControls>
  );
}
