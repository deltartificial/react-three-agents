import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CapsuleCollider,
  RigidBody,
  vec3,
  type RapierRigidBody,
} from "@react-three/rapier";
import { CameraControls, useKeyboardControls } from "@react-three/drei";

export default function CharacterModel() {
  const characterRef = useRef<RapierRigidBody>(null);
  const cameraRef = useRef<CameraControls>(null);
  const MOVEMENT_SPEED = 0.1;
  const JUMP_FORCE = 0.08;

  const [, getKeys] = useKeyboardControls();

  useFrame((state, delta) => {
    if (!characterRef.current || !cameraRef.current) return;

    const { forward, backward, leftward, rightward, jump } = getKeys();
    const impulse = { x: 0, y: 0, z: 0 };

    const cameraRotation = cameraRef.current.azimuthAngle;

    const moveForward = forward ? -1 : backward ? 1 : 0;
    const moveRight = rightward ? 1 : leftward ? -1 : 0;

    impulse.x =
      (Math.sin(cameraRotation) * moveForward +
        Math.cos(cameraRotation) * moveRight) *
      MOVEMENT_SPEED;
    impulse.z =
      (Math.cos(cameraRotation) * moveForward -
        Math.sin(cameraRotation) * moveRight) *
      MOVEMENT_SPEED;

    if (jump) impulse.y += JUMP_FORCE;

    characterRef.current.applyImpulse(vec3(impulse), true);

    const characterPosition = characterRef.current.translation();
    cameraRef.current.setTarget(
      characterPosition.x,
      characterPosition.y + 0.5,
      characterPosition.z,
      true
    );
  });

  return (
    <>
      <CameraControls
        ref={cameraRef}
        makeDefault
        minDistance={2}
        maxDistance={5}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
      />

      <RigidBody
        ref={characterRef}
        colliders={false}
        mass={3}
        type="dynamic"
        position={[0, 3, 0]}
        enabledRotations={[false, false, false]}
        linearDamping={4}
      >
        <CapsuleCollider args={[0.35, 0.3]} />
        <mesh castShadow>
          <capsuleGeometry args={[0.35, 0.6, 4, 8]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      </RigidBody>
    </>
  );
}
