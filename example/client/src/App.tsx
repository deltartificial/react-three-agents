import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Bvh } from "@react-three/drei";
import "./App.css";
import Experience from "./components/Experience";
import { Leva } from "leva";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
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
    </div>
  );
}

export default App;
