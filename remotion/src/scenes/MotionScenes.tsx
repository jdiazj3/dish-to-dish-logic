import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  MotionBackground,
  Kicker,
  Headline,
  Subhead,
  FeatureCard,
  MockDevice,
  BarChart,
  LineChart,
  AlertPill,
  IconCircle,
  FloatingOrb,
  MetricCard,
} from "../components/MotionGraphics";
import { COLORS } from "../theme";

const useLayout = () => {
  const { width, height } = useVideoConfig();
  return { width, height, isHorizontal: width > height };
};

const SVG = {
  plate: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
    </svg>
  ),
  box: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  ),
  chart: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  alert: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  waiter: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  chef: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13.87A4 4 0 0 1 7.41 8a4 4 0 0 1 9.18 0 4 4 0 0 1 1.41 5.87V21H6Z" />
      <path d="M6 10h12" />
      <path d="M8 21v-5a2 2 0 0 1 4 0v5" />
      <path d="M12 21v-5a2 2 0 0 1 4 0v5" />
    </svg>
  ),
  cash: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  check: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  arrow: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
};

export const SceneIntroMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height, isHorizontal } = useLayout();
  const s = spring({ frame, fps, config: { damping: 200 } });
  const words = ["Un solo", "sistema.", "Todo el", "restaurante."];
  return (
    <AbsoluteFill>
      <MotionBackground />
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: isHorizontal ? 120 : 90, paddingRight: isHorizontal ? 120 : 90 }}>
        <div
          style={{
            opacity: s,
            display: "inline-block",
            alignSelf: "flex-start",
            padding: "12px 26px",
            borderRadius: 999,
            border: `2px solid ${COLORS.orange}`,
            color: COLORS.orange,
            fontSize: 26,
            letterSpacing: 6,
            fontWeight: 700,
          }}
        >
          ANCESTRALE POS
        </div>
        <div style={{ marginTop: 34, maxWidth: isHorizontal ? 900 : undefined }}>
          {words.map((w, i) => (
            <div
              key={w}
              style={{
                fontSize: isHorizontal ? 110 : 96,
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: -4,
                color: i % 2 === 1 ? COLORS.orange : COLORS.cream,
                opacity: spring({ frame: frame - 8 - i * 6, fps, config: { damping: 16, stiffness: 140 } }),
                transform: `translateY(${interpolate(spring({ frame: frame - 8 - i * 6, fps, config: { damping: 16, stiffness: 140 } }), [0, 1], [60, 0])}px)`,
              }}
            >
              {w}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 32,
            color: COLORS.muted,
            opacity: interpolate(frame, [36, 56], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          Configuración · Inventario · Mesero · Cocina · Caja
        </div>
      </AbsoluteFill>
      <FloatingOrb color={COLORS.orange} size={240} x={width - 260} y={height - 300} speed={110} />
    </AbsoluteFill>
  );
};

export const SceneProductsMotion: React.FC = () => {
  const { isHorizontal } = useLayout();
  return (
    <AbsoluteFill>
      <MotionBackground tint={COLORS.orange} />
      <AbsoluteFill style={{ paddingTop: 90, paddingLeft: isHorizontal ? 100 : 80, paddingRight: isHorizontal ? 100 : 80 }}>
        <Kicker delay={0}>Configuración</Kicker>
        <div style={{ marginTop: 20 }}>
          <Headline delay={6} size={isHorizontal ? 80 : 72}>Menú con fotos</Headline>
        </div>
        <Subhead delay={14}>Cada plato con imagen, precio en COP y categoría clara.</Subhead>
      </AbsoluteFill>
      <MockDevice delay={22} width={isHorizontal ? 520 : 420} height={isHorizontal ? 720 : 640} x={isHorizontal ? 620 : 460} y={isHorizontal ? 280 : 360} rotate={isHorizontal ? -6 : -2}>
        <div style={{ padding: 28, height: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ height: 14, width: "45%", borderRadius: 8, background: "rgba(255,255,255,.15)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[COLORS.orange, COLORS.amber, COLORS.green, COLORS.red].map((c, i) => (
              <div key={i} style={{ borderRadius: 18, background: "rgba(255,255,255,.05)", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ height: 80, borderRadius: 12, background: c }} />
                <div style={{ height: 12, width: "70%", borderRadius: 6, background: "rgba(255,255,255,.2)" }} />
                <div style={{ height: 12, width: "40%", borderRadius: 6, background: "rgba(255,255,255,.12)" }} />
              </div>
            ))}
          </div>
        </div>
      </MockDevice>
      <FeatureCard icon={SVG.plate} label="Fotos por producto" color={COLORS.orange} delay={34} x={isHorizontal ? 120 : 70} y={isHorizontal ? 420 : 260} />
      <FeatureCard icon={SVG.box} label="Categorías" color={COLORS.amber} delay={42} x={isHorizontal ? 120 : 70} y={isHorizontal ? 520 : 360} />
      <FeatureCard icon={SVG.chart} label="Precios COP" color={COLORS.green} delay={50} x={isHorizontal ? 120 : 70} y={isHorizontal ? 620 : 460} />
    </AbsoluteFill>
  );
};

export const SceneInventoryMotion: React.FC = () => {
  const { isHorizontal } = useLayout();
  return (
    <AbsoluteFill>
      <MotionBackground tint={COLORS.amber} />
      <AbsoluteFill style={{ paddingTop: 90, paddingLeft: isHorizontal ? 100 : 80, paddingRight: isHorizontal ? 100 : 80 }}>
        <Kicker delay={0} color={COLORS.amber}>Inventario</Kicker>
        <div style={{ marginTop: 20 }}>
          <Headline delay={6} size={isHorizontal ? 80 : 72}>Stock bajo control</Headline>
        </div>
        <Subhead delay={14}>Entradas, insumos, proveedores y costos en un solo lugar.</Subhead>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: isHorizontal ? 120 : 80, top: isHorizontal ? 360 : 320 }}>
        <BarChart values={[60, 85, 45, 90, 70]} labels={["L", "M", "M", "J", "V"]} colors={[COLORS.orange, COLORS.amber, COLORS.red, COLORS.green, COLORS.orange]} delay={20} />
      </div>
      <MetricCard value="124" label="Unidades en stock" color={COLORS.green} delay={40} x={isHorizontal ? 520 : 520} y={isHorizontal ? 380 : 320} />
      <MetricCard value="$3.2M" label="Valor inventario" color={COLORS.amber} delay={50} x={isHorizontal ? 780 : 520} y={isHorizontal ? 380 : 480} />
      <AlertPill label="Pollo desmechado: stock bajo" color={COLORS.red} delay={60} x={isHorizontal ? 520 : 80} y={isHorizontal ? 540 : 680} />
    </AbsoluteFill>
  );
};

export const SceneDashboardMotion: React.FC = () => {
  const { isHorizontal } = useLayout();
  return (
    <AbsoluteFill>
      <MotionBackground tint={COLORS.green} />
      <AbsoluteFill style={{ paddingTop: 90, paddingLeft: isHorizontal ? 100 : 80, paddingRight: isHorizontal ? 100 : 80 }}>
        <Kicker delay={0} color={COLORS.green}>Administración</Kicker>
        <div style={{ marginTop: 20 }}>
          <Headline delay={6} size={isHorizontal ? 80 : 72}>Dashboard en vivo</Headline>
        </div>
        <Subhead delay={14}>Ventas del día, ticket promedio y órdenes activas por sede.</Subhead>
      </AbsoluteFill>
      <MetricCard value="$1.8M" label="Ventas hoy" color={COLORS.green} delay={24} x={isHorizontal ? 120 : 80} y={isHorizontal ? 360 : 340} />
      <MetricCard value="$42K" label="Ticket promedio" color={COLORS.orange} delay={32} x={isHorizontal ? 380 : 80} y={isHorizontal ? 360 : 510} />
      <MetricCard value="86" label="Órdenes activas" color={COLORS.amber} delay={40} x={isHorizontal ? 640 : 80} y={isHorizontal ? 360 : 680} />
      <div style={{ position: "absolute", left: isHorizontal ? 120 : 80, top: isHorizontal ? 540 : 900 }}>
        <LineChart values={[40, 55, 48, 70, 65, 85, 90]} delay={48} width={isHorizontal ? 720 : 900} height={isHorizontal ? 220 : 400} color={COLORS.green} />
      </div>

    </AbsoluteFill>
  );
};

export const SceneProfitabilityMotion: React.FC = () => {
  const { isHorizontal } = useLayout();
  return (
    <AbsoluteFill>
      <MotionBackground tint={COLORS.red} intensity={0.12} />
      <AbsoluteFill style={{ paddingTop: 90, paddingLeft: isHorizontal ? 100 : 80, paddingRight: isHorizontal ? 100 : 80 }}>
        <Kicker delay={0} color={COLORS.red}>Rentabilidad</Kicker>
        <div style={{ marginTop: 20 }}>
          <Headline delay={6} size={isHorizontal ? 76 : 68}>Mermas detectadas antes de perder dinero</Headline>
        </div>
        <Subhead delay={14}>Sabrás cuánto stock tienes, cuándo se acaba y dónde se van las mermas.</Subhead>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: isHorizontal ? 120 : 80, top: isHorizontal ? 460 : 420 }}>
        <BarChart
          values={[70, 55, 40, 85, 60]}
          labels={["Entr.", "Princ.", "Beb.", "Post.", "Adic."]}
          colors={[COLORS.green, COLORS.amber, COLORS.red, COLORS.orange, COLORS.amber]}
          delay={24}
        />
      </div>
      <MetricCard value="32%" label="Margen promedio" color={COLORS.green} delay={44} x={isHorizontal ? 520 : 520} y={isHorizontal ? 460 : 420} />
      <AlertPill label="Margen bajo: Hamburguesa BBQ" color={COLORS.red} delay={56} x={isHorizontal ? 520 : 520} y={isHorizontal ? 620 : 580} />
      <AlertPill label="Alerta enviada al admin" color={COLORS.amber} delay={66} x={isHorizontal ? 520 : 520} y={isHorizontal ? 700 : 660} />
    </AbsoluteFill>
  );
};

export const SceneWaiterMotion: React.FC = () => {
  const { isHorizontal } = useLayout();
  return (
    <AbsoluteFill>
      <MotionBackground tint={COLORS.orange} />
      <AbsoluteFill style={{ paddingTop: 90, paddingLeft: isHorizontal ? 100 : 80, paddingRight: isHorizontal ? 100 : 80 }}>
        <Kicker delay={0}>Mesero</Kicker>
        <div style={{ marginTop: 20 }}>
          <Headline delay={6} size={isHorizontal ? 80 : 72}>Vende más rápido</Headline>
        </div>
        <Subhead delay={14}>Selector visual con fotos, buscador y división por silla.</Subhead>
      </AbsoluteFill>
      <MockDevice delay={22} width={isHorizontal ? 480 : 400} height={isHorizontal ? 760 : 680} x={isHorizontal ? 600 : 470} y={isHorizontal ? 280 : 360} rotate={isHorizontal ? 4 : 2}>
        <div style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {["Entradas", "Principales", "Bebidas"].map((t, i) => (
              <div key={t} style={{ flex: 1, height: 36, borderRadius: 10, background: i === 1 ? COLORS.orange : "rgba(255,255,255,.1)" }} />
            ))}
          </div>
          <div style={{ height: 44, borderRadius: 12, background: "rgba(255,255,255,.08)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[COLORS.orange, COLORS.amber, COLORS.green, COLORS.red].map((c, i) => (
              <div key={i} style={{ borderRadius: 16, background: "rgba(255,255,255,.05)", padding: 12 }}>
                <div style={{ height: 70, borderRadius: 10, background: c }} />
                <div style={{ height: 10, marginTop: 10, width: "80%", borderRadius: 5, background: "rgba(255,255,255,.2)" }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: "auto", height: 56, borderRadius: 14, background: COLORS.green }} />
        </div>
      </MockDevice>
      <FeatureCard icon={SVG.waiter} label="Selector visual" color={COLORS.orange} delay={34} x={isHorizontal ? 120 : 70} y={isHorizontal ? 400 : 280} />
      <FeatureCard icon={SVG.box} label="Cuenta por silla" color={COLORS.amber} delay={44} x={isHorizontal ? 120 : 70} y={isHorizontal ? 500 : 380} />
      <FeatureCard icon={SVG.arrow} label="Envío a cocina" color={COLORS.green} delay={54} x={isHorizontal ? 120 : 70} y={isHorizontal ? 600 : 480} />
    </AbsoluteFill>
  );
};

export const SceneKitchenMotion: React.FC = () => {
  const { isHorizontal } = useLayout();
  return (
    <AbsoluteFill>
      <MotionBackground tint={COLORS.red} intensity={0.12} />
      <AbsoluteFill style={{ paddingTop: 90, paddingLeft: isHorizontal ? 100 : 80, paddingRight: isHorizontal ? 100 : 80 }}>
        <Kicker delay={0} color={COLORS.red}>Cocina</Kicker>
        <div style={{ marginTop: 20 }}>
          <Headline delay={6} size={isHorizontal ? 80 : 72}>Comandas claras</Headline>
        </div>
        <Subhead delay={14}>Recibidas, en preparación y listas, con aviso sonoro de orden nueva.</Subhead>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: isHorizontal ? 120 : 80, top: isHorizontal ? 380 : 360, display: "flex", flexDirection: "column", gap: 18 }}>
        {[
          { label: "Mesa 4 · Silla 2 · Hamburguesa BBQ", color: COLORS.red, delay: 24 },
          { label: "Mesa 2 · Silla 1 · Pollo desmechado", color: COLORS.amber, delay: 34 },
          { label: "Mesa 7 · Silla 1 · Limonada natural", color: COLORS.green, delay: 44 },
        ].map((o) => (
          <div
            key={o.label}
            style={{
              width: isHorizontal ? 560 : 460,
              padding: "24px 28px",
              borderRadius: 22,
              background: "rgba(255,255,255,.06)",
              borderLeft: `6px solid ${o.color}`,
              opacity: spring({ frame: useCurrentFrame() - o.delay, fps: 30, config: { damping: 18, stiffness: 150 } }),
              transform: `translateX(${interpolate(spring({ frame: useCurrentFrame() - o.delay, fps: 30, config: { damping: 18, stiffness: 150 } }), [0, 1], [-60, 0])}px)`,
            }}
          >
            <div style={{ color: COLORS.cream, fontSize: 26, fontWeight: 600 }}>{o.label}</div>
            <div style={{ marginTop: 6, color: COLORS.muted, fontSize: 18 }}>Hace 2 min</div>
          </div>
        ))}
      </div>
      <IconCircle color={COLORS.red} size={100} delay={56} x={isHorizontal ? 780 : 560} y={isHorizontal ? 420 : 780}>
        {SVG.alert}
      </IconCircle>
      <AlertPill label="Alarma de orden nueva" color={COLORS.red} delay={64} x={isHorizontal ? 760 : 80} y={isHorizontal ? 560 : 920} />
    </AbsoluteFill>
  );
};

export const SceneCashierMotion: React.FC = () => {
  const { isHorizontal } = useLayout();
  return (
    <AbsoluteFill>
      <MotionBackground tint={COLORS.green} />
      <AbsoluteFill style={{ paddingTop: 90, paddingLeft: isHorizontal ? 100 : 80, paddingRight: isHorizontal ? 100 : 80 }}>
        <Kicker delay={0} color={COLORS.green}>Caja</Kicker>
        <div style={{ marginTop: 20 }}>
          <Headline delay={6} size={isHorizontal ? 80 : 72}>Cobra al instante</Headline>
        </div>
        <Subhead delay={14}>Efectivo, débito, crédito, Nequi, Daviplata y cierre automático.</Subhead>
      </AbsoluteFill>
      <MockDevice delay={22} width={isHorizontal ? 500 : 400} height={isHorizontal ? 720 : 640} x={isHorizontal ? 600 : 470} y={isHorizontal ? 300 : 380} rotate={isHorizontal ? -3 : -1}>
        <div style={{ padding: 28, height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ height: 20, width: "60%", borderRadius: 8, background: "rgba(255,255,255,.2)" }} />
          {["Efectivo", "Débito", "Crédito", "Nequi"].map((m, i) => (
            <div key={m} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, background: i === 0 ? COLORS.green : "rgba(255,255,255,.06)" }}>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: COLORS.cream }} />
              <div style={{ flex: 1, height: 14, borderRadius: 6, background: "rgba(255,255,255,.2)" }} />
            </div>
          ))}
          <div style={{ marginTop: "auto", height: 56, borderRadius: 14, background: COLORS.orange }} />
        </div>
      </MockDevice>
      <FeatureCard icon={SVG.cash} label="Múltiples métodos" color={COLORS.green} delay={34} x={isHorizontal ? 120 : 70} y={isHorizontal ? 400 : 280} />
      <FeatureCard icon={SVG.box} label="Venta en mostrador" color={COLORS.orange} delay={44} x={isHorizontal ? 120 : 70} y={isHorizontal ? 500 : 380} />
      <FeatureCard icon={SVG.chart} label="Cierre diario" color={COLORS.amber} delay={54} x={isHorizontal ? 120 : 70} y={isHorizontal ? 600 : 480} />
    </AbsoluteFill>
  );
};

export const SceneOutroMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isHorizontal } = useLayout();
  const items = [
    "Menú con fotos y categorías",
    "Inventario e insumos con costos",
    "Dashboard y alertas de rentabilidad",
    "Mesero visual y cocina en tiempo real",
    "Caja, mostrador y cierre diario",
  ];
  return (
    <AbsoluteFill>
      <MotionBackground tint={COLORS.amber} />
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: isHorizontal ? 120 : 90, paddingRight: isHorizontal ? 120 : 90 }}>
        <div
          style={{
            fontSize: isHorizontal ? 92 : 78,
            fontWeight: 800,
            letterSpacing: -4,
            color: COLORS.cream,
            opacity: spring({ frame, fps, config: { damping: 200 } }),
          }}
        >
          Todo conectado.
        </div>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 18 }}>
          {items.map((t, i) => {
            const s = spring({ frame: frame - 12 - i * 5, fps, config: { damping: 18, stiffness: 150 } });
            return (
              <div
                key={t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  opacity: s,
                  transform: `translateX(${interpolate(s, [0, 1], [-40, 0])}px)`,
                }}
              >
                <div style={{ width: 16, height: 16, borderRadius: 5, background: COLORS.orange }} />
                <div style={{ fontSize: isHorizontal ? 36 : 32, color: COLORS.cream, fontWeight: 500 }}>{t}</div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 44,
            fontSize: isHorizontal ? 48 : 42,
            fontWeight: 700,
            color: COLORS.orange,
            opacity: interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          Ancestrale POS
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
