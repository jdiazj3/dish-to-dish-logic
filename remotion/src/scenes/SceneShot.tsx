import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, Caption, ShotFrame } from "../components/Shared";
import { COLORS } from "../theme";

export const SceneShot: React.FC<{
  kicker: string;
  title: string;
  sub?: string;
  src: string;
  focus?: number;
  accent?: string;
  chips?: { label: string; color: string }[];
}> = ({ kicker, title, sub, src, focus = 0, accent = COLORS.orange, chips = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop tint={accent} />
      <AbsoluteFill style={{ paddingTop: 110 }}>
        <Caption kicker={kicker} title={title} sub={sub} accent={accent} />
        <div style={{ display: "flex", justifyContent: "center", marginTop: 60 }}>
          <ShotFrame src={src} focus={focus} delay={10} />
        </div>
      </AbsoluteFill>
      {chips.length > 0 ? (
        <div
          style={{
            position: "absolute",
            bottom: 90,
            left: 0,
            right: 0,
            display: "flex",
            gap: 18,
            justifyContent: "center",
            flexWrap: "wrap",
            paddingLeft: 70,
            paddingRight: 70,
          }}
        >
          {chips.map((c, i) => {
            const s = spring({ frame: frame - 40 - i * 8, fps, config: { damping: 14, stiffness: 160 } });
            return (
              <div
                key={c.label}
                style={{
                  opacity: s,
                  transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
                  padding: "16px 30px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.07)",
                  border: `2px solid ${c.color}`,
                  color: COLORS.cream,
                  fontSize: 30,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: c.color, marginRight: 12 }}>●</span>
                {c.label}
              </div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
