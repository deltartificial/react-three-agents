import { RigidBody } from "@react-three/rapier";
import { Text } from "@react-three/drei";
import * as THREE from "three";

export default function Slopes() {
  // Angles en degrés
  const angles = [23.5, 43.1, 62.7];

  return (
    <group position={[-10, -1, 10]}>
      {angles.map((angle, index) => {
        const radians = (angle * Math.PI) / 180;
        const xPos = (index - 1) * 3.5;
        const yPos = 1 + index * 2;

        return (
          <group key={angle} position={[xPos, yPos, 0]}>
            <RigidBody type="fixed" colliders="cuboid">
              <mesh receiveShadow rotation={[0, 0, radians]}>
                <boxGeometry args={[5, 0.2, 5]} />
                <meshStandardMaterial
                  color={`hsl(${200 + index * 30}, 70%, 50%)`}
                  roughness={0.7}
                />
              </mesh>
            </RigidBody>
            <Text
              rotation={[0, Math.PI, 0]}
              position={[0, 1.5, 0]}
              color="black"
              fontSize={0.5}
            >
              {angle} Deg
            </Text>
          </group>
        );
      })}
    </group>
  );
}
