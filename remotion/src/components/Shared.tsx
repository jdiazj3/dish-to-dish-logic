import React from "react";
import { AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

export const Backdrop: React.FC<{ tint?: string }> = ({ tint = COLORS.orange }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 40;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${20 + drift / 6}% 12%, ${tint}33, transparent 65%), radial-gradient(1100px 1100px at 85% 90%, #F2A93B22, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.06,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          transform: `translateY(${drift}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

type ShotProps = {
  src: string;
  /** 0..1 vertical focus of the crop */
  focus?: number;
  delay?: number;
  zoom?: number;
};

export const ShotFrame: React.FC<ShotProps> = ({ src, focus = 0, delay = 0, zoom = 1 }) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  const enter = interpolate(f, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const y = interpolate(enter, [0, 1], [70, 0]);
  const scale = interpolate(enter, [0, 1], [0.94, 1]) * (zoom + f * 0.00035);
  const pan = interpolate(f, [0, 150], [0, -40], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        width: 900,
        height: 1120,
        borderRadius: 34,
        overflow: "hidden",
        background: COLORS.cream,
        opacity: enter,
        transform: `translateY(${y}px) scale(${scale})`,
        boxShadow: "0 50px 120px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08)",
        position: "relative",
      }}
    >
      <div
        style={{
          height: 54,
          background: "#EDE6DC",
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: 24,
        }}
      >
        {["#E8632A", "#F2A93B", "#2E9E68"].map((c) => (
          <div key={c} style={{ width: 14, height: 14, borderRadius: 99, background: c }} />
        ))}
      </div>
      <div style={{ height: 1066, overflow: "hidden", position: "relative" }}>
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            display: "block",
            transform: `translateY(${-focus * 300 + pan}px)`,
          }}
        />
      </div>
    </div>
  );
};

export const Caption: React.FC<{
  kicker: string;
  title: string;
  sub?: string;
  accent?: string;
  delay?: number;
}> = ({ kicker, title, sub, accent = COLORS.orange, delay = 0 }) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  const a = (d: number) =>
    interpolate(f, [d, d + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ paddingLeft: 90, paddingRight: 90 }}>
      <div
        style={{
          opacity: a(0),
          transform: `translateX(${interpolate(a(0), [0, 1], [-30, 0])}px)`,
          display: "inline-block",
          padding: "10px 22px",
          borderRadius: 999,
          background: accent,
          color: "#fff",
          fontSize: 26,
          letterSpacing: 4,
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          marginTop: 22,
          fontSize: 82,
          lineHeight: 1.02,
          letterSpacing: -2.5,
          fontWeight: 800,
          color: COLORS.cream,
          opacity: a(6),
          transform: `translateY(${interpolate(a(6), [0, 1], [28, 0])}px)`,
        }}
      >
        {title}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 16,
            fontSize: 34,
            lineHeight: 1.25,
            color: COLORS.muted,
            maxWidth: 860,
            opacity: a(12),
            transform: `translateY(${interpolate(a(12), [0, 1], [20, 0])}px)`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
