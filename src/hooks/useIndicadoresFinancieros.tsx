import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface ProductoRentable {
  producto_id: string;
  nombre: string;
  cantidad: number;
  ventas: number;
  costo: number;
  ganancia: number;
  margen: number;
  margenUnitario: number;
}

export interface GastoCategoria {
  categoria: string;
  total: number;
  esFijo: boolean;
}

interface Params {
  fechaInicio?: Date;
  fechaFin?: Date;
}

const iso = (d: Date) => d.toISOString();

export function useIndicadoresFinancieros({ fechaInicio, fechaFin }: Params = {}) {
  const desde = fechaInicio ?? startOfMonth(new Date());
  const hasta = fechaFin ?? endOfMonth(new Date());
  const desdePrev = startOfMonth(subMonths(desde, 1));
  const hastaPrev = endOfMonth(subMonths(desde, 1));

  const key = [format(desde, "yyyy-MM-dd"), format(hasta, "yyyy-MM-dd")];

  // Costos unitarios reales (receta de insumos o costo promedio de compra)
  const { data: costos } = useQuery({
    queryKey: ["indicadores", "costos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vista_costos_productos")
        .select("producto_id, nombre, precio, costo_unitario, origen_costo");
      if (error) throw error;
      return data || [];
    },
  });

  // Facturas del período y del período anterior
  const { data: facturas, isLoading: cargandoFacturas } = useQuery({
    queryKey: ["indicadores", "facturas", ...key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facturas")
        .select("id, total, created_at")
        .gte("created_at", iso(desde))
        .lte("created_at", iso(hasta));
      if (error) throw error;
      return data || [];
    },
  });

  const { data: facturasPrev } = useQuery({
    queryKey: ["indicadores", "facturas-prev", format(desdePrev, "yyyy-MM")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facturas")
        .select("id, total")
        .gte("created_at", iso(desdePrev))
        .lte("created_at", iso(hastaPrev));
      if (error) throw error;
      return data || [];
    },
  });

  // Items vendidos del período (para CMV y matriz de menú)
  const { data: items } = useQuery({
    queryKey: ["indicadores", "items", ...key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factura_items")
        .select("producto_id, producto_nombre, cantidad, subtotal, facturas!inner(created_at)")
        .gte("facturas.created_at", iso(desde))
        .lte("facturas.created_at", iso(hasta));
      if (error) throw error;
      return data || [];
    },
  });

  // Gastos aprobados del período y del anterior
  const { data: gastos } = useQuery({
    queryKey: ["indicadores", "gastos", ...key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimientos_caja")
        .select("monto, fecha_movimiento, categorias_gastos(nombre, es_fijo)")
        .eq("tipo", "salida")
        .eq("estado", "aprobado")
        .gte("fecha_movimiento", format(desde, "yyyy-MM-dd"))
        .lte("fecha_movimiento", format(hasta, "yyyy-MM-dd"));
      if (error) throw error;
      return data || [];
    },
  });

  const { data: gastosPrev } = useQuery({
    queryKey: ["indicadores", "gastos-prev", format(desdePrev, "yyyy-MM")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimientos_caja")
        .select("monto, categorias_gastos(nombre, es_fijo)")
        .eq("tipo", "salida")
        .eq("estado", "aprobado")
        .gte("fecha_movimiento", format(desdePrev, "yyyy-MM-dd"))
        .lte("fecha_movimiento", format(hastaPrev, "yyyy-MM-dd"));
      if (error) throw error;
      return data || [];
    },
  });

  const productos: ProductoRentable[] = useMemo(() => {
    if (!items || !costos) return [];
    const porId = new Map(costos.map((c) => [c.producto_id as string, c]));
    const porNombre = new Map(costos.map((c) => [(c.nombre as string)?.toLowerCase(), c]));
    const acc = new Map<string, ProductoRentable>();

    items.forEach((it) => {
      const info =
        (it.producto_id ? porId.get(it.producto_id) : undefined) ||
        porNombre.get(it.producto_nombre?.toLowerCase());
      const clave = (info?.producto_id as string) || it.producto_nombre;
      const costoUnit = Number(info?.costo_unitario || 0);
      const prev =
        acc.get(clave) ||
        ({
          producto_id: clave,
          nombre: (info?.nombre as string) || it.producto_nombre,
          cantidad: 0,
          ventas: 0,
          costo: 0,
          ganancia: 0,
          margen: 0,
          margenUnitario: 0,
        } as ProductoRentable);
      prev.cantidad += it.cantidad;
      prev.ventas += Number(it.subtotal || 0);
      prev.costo += costoUnit * it.cantidad;
      acc.set(clave, prev);
    });

    return Array.from(acc.values()).map((p) => {
      p.ganancia = p.ventas - p.costo;
      p.margen = p.ventas > 0 ? (p.ganancia / p.ventas) * 100 : 0;
      p.margenUnitario = p.cantidad > 0 ? p.ganancia / p.cantidad : 0;
      return p;
    });
  }, [items, costos]);

  const ventas = (facturas || []).reduce((a, f) => a + Number(f.total || 0), 0);
  const ventasPrev = (facturasPrev || []).reduce((a, f) => a + Number(f.total || 0), 0);
  const numFacturas = (facturas || []).length;
  const cmv = productos.reduce((a, p) => a + p.costo, 0);

  const gastosPorCategoria: GastoCategoria[] = useMemo(() => {
    const acc = new Map<string, GastoCategoria>();
    (gastos || []).forEach((g) => {
      const cat = (g.categorias_gastos as { nombre?: string; es_fijo?: boolean } | null);
      const nombre = cat?.nombre || "Sin categoría";
      const prev = acc.get(nombre) || { categoria: nombre, total: 0, esFijo: !!cat?.es_fijo };
      prev.total += Number(g.monto || 0);
      acc.set(nombre, prev);
    });
    return Array.from(acc.values()).sort((a, b) => b.total - a.total);
  }, [gastos]);

  const gastosFijos = gastosPorCategoria.filter((g) => g.esFijo).reduce((a, g) => a + g.total, 0);
  const gastosVariables = gastosPorCategoria.filter((g) => !g.esFijo).reduce((a, g) => a + g.total, 0);
  const gastosPrevTotal = (gastosPrev || []).reduce((a, g) => a + Number(g.monto || 0), 0);

  const margenContribucion = ventas - cmv;
  const porcentajeContribucion = ventas > 0 ? margenContribucion / ventas : 0;
  const utilidadOperativa = margenContribucion - gastosFijos - gastosVariables;

  const puntoEquilibrio = porcentajeContribucion > 0 ? gastosFijos / porcentajeContribucion : 0;
  const diasPeriodo = Math.max(
    1,
    Math.round((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const puntoEquilibrioDiario = puntoEquilibrio / diasPeriodo;
  const ticketPromedio = numFacturas > 0 ? ventas / numFacturas : 0;
  const ticketsDiaNecesarios = ticketPromedio > 0 ? puntoEquilibrioDiario / ticketPromedio : 0;
  const avancePuntoEquilibrio = puntoEquilibrio > 0 ? Math.min(100, (ventas / puntoEquilibrio) * 100) : 0;

  return {
    cargando: cargandoFacturas,
    periodo: { desde, hasta, diasPeriodo },
    ventas,
    ventasPrev,
    numFacturas,
    cmv,
    margenContribucion,
    porcentajeContribucion,
    gastosFijos,
    gastosVariables,
    gastosPrevTotal,
    gastosPorCategoria,
    utilidadOperativa,
    puntoEquilibrio,
    puntoEquilibrioDiario,
    ticketPromedio,
    ticketsDiaNecesarios,
    avancePuntoEquilibrio,
    productos,
  };
}
