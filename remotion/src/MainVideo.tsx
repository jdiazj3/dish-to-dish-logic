import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/Outfit";
import { SceneShot } from "./scenes/SceneShot";
import { SceneIntro, SceneOutro } from "./scenes/SceneTitles";
import { COLORS, SHOTS } from "./theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });

const T = 18;
const timing = springTiming({ config: { damping: 200 }, durationInFrames: T });

type Shot = {
  kicker: string;
  title: string;
  sub?: string;
  src: string;
  focus?: number;
  accent?: string;
  chips?: { label: string; color: string }[];
  dur: number;
};

const SHOT_SCENES: Shot[] = [
  {
    kicker: "Configuración",
    title: "Menú y categorías",
    sub: "Cada plato con foto, precio y disponibilidad, organizado por categoría.",
    src: SHOTS.productos,
    dur: 115,
    chips: [
      { label: "Fotos de producto", color: COLORS.orange },
      { label: "Precios en COP", color: COLORS.amber },
    ],
  },
  {
    kicker: "Configuración",
    title: "Inventario e insumos",
    sub: "Compras, entradas, stock y proveedores en un mismo lugar.",
    src: SHOTS.inventario,
    accent: COLORS.amber,
    dur: 115,
    chips: [
      { label: "Stock actual", color: COLORS.green },
      { label: "Costo por insumo", color: COLORS.amber },
    ],
  },
  {
    kicker: "Administración",
    title: "Dashboard en vivo",
    sub: "Ventas del día, ticket promedio y órdenes activas por estado.",
    src: SHOTS.adminDashboard,
    dur: 125,
    chips: [
      { label: "Ventas de hoy", color: COLORS.green },
      { label: "Órdenes en tiempo real", color: COLORS.orange },
    ],
  },
  {
    kicker: "Alertas",
    title: "Margen bajo control",
    sub: "Rentabilidad por producto, por sede y por turno, con alarma de margen bajo.",
    src: SHOTS.reportes,
    accent: COLORS.red,
    dur: 130,
    chips: [
      { label: "Alerta de margen bajo", color: COLORS.red },
      { label: "Umbral configurable", color: COLORS.amber },
    ],
  },
  {
    kicker: "Mesero",
    title: "Órdenes por mesa",
    sub: "Ve sus mesas activas y crea pedidos en segundos.",
    src: SHOTS.mesero,
    dur: 110,
    chips: [{ label: "Estado en espera / listo", color: COLORS.orange }],
  },
  {
    kicker: "Mesero",
    title: "Elegir con la foto",
    sub: "Selector visual con buscador, categorías y división por silla.",
    src: SHOTS.crearOrden,
    dur: 120,
    chips: [
      { label: "Buscador", color: COLORS.amber },
      { label: "Cuenta por silla", color: COLORS.orange },
    ],
  },
  {
    kicker: "Cocina",
    title: "Comandas al instante",
    sub: "Recibidas, en preparación y entregadas, con aviso sonoro de orden nueva.",
    src: SHOTS.cocina,
    accent: COLORS.red,
    dur: 135,
    chips: [
      { label: "Alarma de orden nueva", color: COLORS.red },
      { label: "Impresión 80mm", color: COLORS.cream },
    ],
  },
  {
    kicker: "Caja",
    title: "Facturación y cobro",
    sub: "Efectivo, débito, crédito, Nequi y Daviplata, con factura en PDF.",
    src: SHOTS.facturacion,
    accent: COLORS.green,
    dur: 120,
    chips: [{ label: "Factura PDF por correo", color: COLORS.green }],
  },
  {
    kicker: "Caja",
    title: "Venta en mostrador",
    sub: "Cobra al instante o carga el consumo a la cuenta de una mesa.",
    src: SHOTS.mostrador,
    accent: COLORS.green,
    dur: 115,
    chips: [{ label: "Cobro inmediato", color: COLORS.green }, { label: "Cargar a mesa", color: COLORS.orange }],
  },
  {
    kicker: "Caja",
    title: "Flujo y cierre diario",
    sub: "Movimientos, cuentas, gastos recurrentes y cierre por método de pago.",
    src: SHOTS.flujo,
    accent: COLORS.amber,
    dur: 120,
    chips: [{ label: "Cierre de caja", color: COLORS.amber }],
  },
];

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={110}>
          <SceneIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        {SHOT_SCENES.map((s, i) => (
          <React.Fragment key={s.title}>
            <TransitionSeries.Sequence durationInFrames={s.dur}>
              <SceneShot {...s} />
            </TransitionSeries.Sequence>
            <TransitionSeries.Transition
              presentation={i % 3 === 2 ? fade() : slide({ direction: "from-right" })}
              timing={timing}
            />
          </React.Fragment>
        ))}
        <TransitionSeries.Sequence durationInFrames={150}>
          <SceneOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const TOTAL_FRAMES =
  110 + 150 + SHOT_SCENES.reduce((a, s) => a + s.dur, 0) - T * (SHOT_SCENES.length + 1);
