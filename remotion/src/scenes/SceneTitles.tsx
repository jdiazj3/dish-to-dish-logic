import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "../components/Shared";
import { COLORS } from "../theme";

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 } });
  const words = ["Un solo", "sistema.", "Todo el", "restaurante."];
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 100, paddingRight: 100 }}>
        <div
          style={{
            opacity: s,
            display: "inline-block",
            alignSelf: "flex-start",
            padding: "12px 26px",
            borderRadius: 999,
            border: `2px solid ${COLORS.orange}`,
            color: COLORS.orange,
            fontSize: 28,
            letterSpacing: 6,
            fontWeight: 700,
          }}
        >
          ANCESTRALE POS
        </div>
        <div style={{ marginTop: 40 }}>
          {words.map((w, i) => {
            const sp = spring({ frame: frame - 8 - i * 7, fps, config: { damping: 16, stiffness: 140 } });
            return (
              <div
                key={w}
                style={{
                  fontSize: 124,
                  lineHeight: 1.0,
                  fontWeight: 800,
                  letterSpacing: -5,
                  color: i % 2 === 1 ? COLORS.orange : COLORS.cream,
                  opacity: sp,
                  transform: `translateY(${interpolate(sp, [0, 1], [70, 0])}px)`,
                }}
              >
                {w}
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 46,
            fontSize: 36,
            color: COLORS.muted,
            opacity: interpolate(frame, [40, 62], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          Configuración · Mesero · Cocina · Caja
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    "Productos con foto y categorías",
    "Inventario e insumos con costos",
    "Órdenes por mesa y por silla",
    "Comandas en tiempo real en cocina",
    "Caja, mostrador y cierre diario",
    "Alertas de margen y stock",
  ];
  return (
    <AbsoluteFill>
      <Backdrop tint={COLORS.amber} />
      <AbsoluteFill style={{ justifyContent: "center", padding: 100 }}>
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: -4,
            color: COLORS.cream,
            opacity: spring({ frame, fps, config: { damping: 200 } }),
          }}
        >
          Todo conectado.
        </div>
        <div style={{ marginTop: 48 }}>
          {items.map((t, i) => {
            const sp = spring({ frame: frame - 12 - i * 6, fps, config: { damping: 18, stiffness: 150 } });
            return (
              <div
                key={t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  marginBottom: 26,
                  opacity: sp,
                  transform: `translateX(${interpolate(sp, [0, 1], [-40, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    background: COLORS.orange,
                  }}
                />
                <div style={{ fontSize: 40, color: COLORS.cream, fontWeight: 500 }}>{t}</div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.orange,
            opacity: interpolate(frame, [70, 92], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          Ancestrale POS
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
