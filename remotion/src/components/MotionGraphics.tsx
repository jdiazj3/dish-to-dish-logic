import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

export const MotionBackground: React.FC<{ tint?: string; intensity?: number }> = ({
  tint = COLORS.orange,
  intensity = 0.15,
}) => {
  const frame = useCurrentFrame();
  const drift1 = Math.sin(frame / 120) * 60;
  const drift2 = Math.cos(frame / 140) * 50;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1000px 1000px at ${25 + drift1 / 8}% ${15 + drift2 / 10}%, ${tint}${Math.floor(intensity * 255).toString(16).padStart(2, "0")}, transparent 65%), radial-gradient(1200px 1200px at 80% 85%, ${COLORS.amber}18, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.05,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
          transform: `translateY(${drift2 / 3}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const Kicker: React.FC<{ children: React.ReactNode; color?: string; delay?: number }> = ({
  children,
  color = COLORS.orange,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 180 } });
  return (
    <div
      style={{
        display: "inline-block",
        padding: "10px 22px",
        borderRadius: 999,
        background: color,
        color: "#fff",
        fontSize: 24,
        letterSpacing: 4,
        textTransform: "uppercase",
        fontWeight: 700,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

export const Headline: React.FC<{ children: React.ReactNode; delay?: number; size?: number; color?: string }> = ({
  children,
  delay = 0,
  size = 86,
  color = COLORS.cream,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 140 } });
  return (
    <div
      style={{
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: -3,
        fontWeight: 800,
        color,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

export const Subhead: React.FC<{ children: React.ReactNode; delay?: number; size?: number }> = ({
  children,
  delay = 0,
  size = 34,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 150 } });
  return (
    <div
      style={{
        marginTop: 18,
        fontSize: size,
        lineHeight: 1.3,
        color: COLORS.muted,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

export const FeatureCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  color?: string;
  delay?: number;
  x?: number;
  y?: number;
}> = ({ icon, label, color = COLORS.orange, delay = 0, x = 0, y = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 160 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "18px 26px",
        borderRadius: 24,
        background: "rgba(255,255,255,.06)",
        border: `2px solid ${color}`,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px) scale(${interpolate(s, [0, 1], [0.9, 1])})`,
        boxShadow: `0 20px 50px rgba(0,0,0,.3), 0 0 0 1px ${color}22`,
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color, display: "grid", placeItems: "center" }}>
        {icon}
      </div>
      <div style={{ color: COLORS.cream, fontSize: 28, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
};

export const MockDevice: React.FC<{
  children: React.ReactNode;
  delay?: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  rotate?: number;
}> = ({ children, delay = 0, width = 520, height = 720, x = 0, y = 0, rotate = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120 } });
  const float = Math.sin(frame / 60) * 8;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        borderRadius: 36,
        background: COLORS.bgAlt,
        border: "2px solid rgba(255,255,255,.12)",
        boxShadow: "0 60px 140px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.05)",
        padding: 20,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [80, 0]) + float}px) rotate(${rotate}deg) scale(${interpolate(s, [0, 1], [0.92, 1])})`,
      }}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: 22, overflow: "hidden", background: COLORS.bg }}>
        {children}
      </div>
    </div>
  );
};

export const BarChart: React.FC<{
  values: number[];
  labels: string[];
  colors?: string[];
  delay?: number;
  x?: number;
  y?: number;
}> = ({ values, labels, colors, delay = 0, x = 0, y = 0 }) => {
  const frame = useCurrentFrame();
  const max = Math.max(...values);
  const barW = 48;
  const gap = 28;
  const totalW = values.length * barW + (values.length - 1) * gap;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: totalW, height: 260 }}>
      <svg width={totalW} height={260}>
        {values.map((v, i) => {
          const h = (v / max) * 180;
          const barH = interpolate(frame, [delay + i * 4, delay + 24 + i * 4], [0, h], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: (t) => 1 - Math.pow(1 - t, 3),
          });
          return (
            <g key={i}>
              <rect
                x={i * (barW + gap)}
                y={220 - barH}
                width={barW}
                height={barH}
                rx={8}
                fill={colors?.[i] ?? COLORS.orange}
              />
              <text
                x={i * (barW + gap) + barW / 2}
                y={245}
                textAnchor="middle"
                fill={COLORS.muted}
                fontSize={16}
                fontWeight={600}
              >
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const LineChart: React.FC<{
  values: number[];
  delay?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
}> = ({ values, delay = 0, x = 0, y = 0, width = 420, height = 220, color = COLORS.green }) => {
  const frame = useCurrentFrame();
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const px = (i / (values.length - 1)) * width;
    const py = height - ((v - min) / range) * (height - 40) - 20;
    return `${px},${py}`;
  });
  const progress = interpolate(frame, [delay, delay + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const visiblePoints = points.slice(0, Math.max(2, Math.floor(points.length * progress)));
  if (visiblePoints.length < 2) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      <svg width={width} height={height}>
        <polyline points={visiblePoints.join(" ")} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        {visiblePoints.map((p, i) => {
          const [cx, cy] = p.split(",").map(Number);
          return <circle key={i} cx={cx} cy={cy} r={5} fill={color} />;
        })}
      </svg>
    </div>
  );
};

export const AlertPill: React.FC<{
  label: string;
  color?: string;
  delay?: number;
  x?: number;
  y?: number;
}> = ({ label, color = COLORS.red, delay = 0, x = 0, y = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 180 } });
  const pulse = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 28px",
        borderRadius: 999,
        background: `${color}18`,
        border: `2px solid ${color}`,
        color: COLORS.cream,
        fontSize: 26,
        fontWeight: 700,
        opacity: s,
        transform: `translateX(${interpolate(s, [0, 1], [60, 0])}px)`,
        boxShadow: `0 0 ${20 + pulse * 15}px ${color}44`,
      }}
    >
      <span style={{ width: 14, height: 14, borderRadius: 99, background: color, display: "inline-block" }} />
      {label}
    </div>
  );
};

export const IconCircle: React.FC<{
  children: React.ReactNode;
  color?: string;
  size?: number;
  delay?: number;
  x?: number;
  y?: number;
}> = ({ children, color = COLORS.orange, size = 80, delay = 0, x = 0, y = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 160 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: 999,
        background: color,
        display: "grid",
        placeItems: "center",
        opacity: s,
        transform: `scale(${interpolate(s, [0, 1], [0, 1])})`,
      }}
    >
      {children}
    </div>
  );
};

export const FloatingOrb: React.FC<{ color?: string; size?: number; x?: number; y?: number; speed?: number }> = ({
  color = COLORS.orange,
  size = 200,
  x = 0,
  y = 0,
  speed = 100,
}) => {
  const frame = useCurrentFrame();
  const dx = Math.sin(frame / speed) * 30;
  const dy = Math.cos(frame / (speed * 1.3)) * 20;
  return (
    <div
      style={{
        position: "absolute",
        left: x + dx,
        top: y + dy,
        width: size,
        height: size,
        borderRadius: 999,
        background: `radial-gradient(circle at 30% 30%, ${color}66, ${color}11)`,
        filter: "blur(40px)",
      }}
    />
  );
};

export const MetricCard: React.FC<{
  value: string;
  label: string;
  color?: string;
  delay?: number;
  x?: number;
  y?: number;
}> = ({ value, label, color = COLORS.green, delay = 0, x = 0, y = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 140 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 220,
        padding: "26px 28px",
        borderRadius: 24,
        background: "rgba(255,255,255,.06)",
        border: `2px solid ${color}`,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
      }}
    >
      <div style={{ fontSize: 44, fontWeight: 800, color }}>{value}</div>
      <div style={{ marginTop: 6, fontSize: 20, color: COLORS.muted, fontWeight: 500 }}>{label}</div>
    </div>
  );
};
