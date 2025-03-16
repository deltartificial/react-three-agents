import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

export default function RoughPlane() {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={[10, -1.2, 10]}>
      <mesh receiveShadow>
        <boxGeometry args={[20, 0.2, 20]} />
        <meshStandardMaterial color="#555555" roughness={0.8} />
      </mesh>
    </RigidBody>
  );
}
