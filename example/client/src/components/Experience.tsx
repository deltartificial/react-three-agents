import { Grid } from "@react-three/drei";
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
import { useEffect, useState } from "react";

export default function Experience() {
  const [pausedPhysics, setPausedPhysics] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPausedPhysics(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  const { physics, disableControl, disableFollowCam } = useControls(
    "World Settings",
    {
      physics: false,
      disableControl: false,
      disableFollowCam: false,
    }
  );

  // const keyboardMap = [
  //   { name: "forward", keys: ["ArrowUp", "KeyW"] },
  //   { name: "backward", keys: ["ArrowDown", "KeyS"] },
  //   { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
  //   { name: "rightward", keys: ["ArrowRight", "KeyD"] },
  //   { name: "jump", keys: ["Space"] },
  //   { name: "run", keys: ["Shift"] },
  //   { name: "action1", keys: ["1"] },
  //   { name: "action2", keys: ["2"] },
  //   { name: "action3", keys: ["3"] },
  //   { name: "action4", keys: ["KeyF"] },
  // ];

  return (
    <>
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
      </Physics>
    </>
  );
}
