import { Composition } from "remotion";
import { MainVideoMotion, TOTAL_FRAMES_MOTION } from "./MainVideoMotion";

export const RemotionRoot = () => (
  <>
    <Composition
      id="main-vertical"
      component={MainVideoMotion}
      durationInFrames={TOTAL_FRAMES_MOTION}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="main-horizontal"
      component={MainVideoMotion}
      durationInFrames={TOTAL_FRAMES_MOTION}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
