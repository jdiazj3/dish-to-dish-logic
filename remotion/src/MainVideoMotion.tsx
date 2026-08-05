import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/Outfit";
import {
  SceneIntroMotion,
  SceneProductsMotion,
  SceneInventoryMotion,
  SceneDashboardMotion,
  SceneProfitabilityMotion,
  SceneWaiterMotion,
  SceneKitchenMotion,
  SceneCashierMotion,
  SceneOutroMotion,
} from "./scenes/MotionScenes";
import { COLORS } from "./theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });

const T = 18;
const timing = springTiming({ config: { damping: 200 }, durationInFrames: T });

type SceneDef = { component: React.FC; dur: number };

const SCENES: SceneDef[] = [
  { component: SceneIntroMotion, dur: 140 },
  { component: SceneProductsMotion, dur: 150 },
  { component: SceneInventoryMotion, dur: 150 },
  { component: SceneDashboardMotion, dur: 150 },
  { component: SceneProfitabilityMotion, dur: 180 },
  { component: SceneWaiterMotion, dur: 150 },
  { component: SceneKitchenMotion, dur: 150 },
  { component: SceneCashierMotion, dur: 150 },
  { component: SceneOutroMotion, dur: 200 },
];

export const MainVideoMotion: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        {SCENES.map((s, i) => {
          const Component = s.component;
          return (
            <React.Fragment key={i}>
              <TransitionSeries.Sequence durationInFrames={s.dur}>
                <Component />
              </TransitionSeries.Sequence>
              {i < SCENES.length - 1 ? (
                <TransitionSeries.Transition
                  presentation={i % 3 === 2 ? fade() : slide({ direction: "from-right" })}
                  timing={timing}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const TOTAL_FRAMES_MOTION = SCENES.reduce((a, s) => a + s.dur, 0) - T * (SCENES.length - 1);
