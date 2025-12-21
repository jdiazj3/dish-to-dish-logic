import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks, parseISO, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";

interface DatoSemanal {
  semana: string;
  fechaInicio: string;
  fechaFin: string;
  inversion: number;
  ventas: number;
  margen: number;
}

const chartConfig = {
  margen: {
    label: "Margen %",
    color: "hsl(var(--chart-2))",
  },
};

export function GraficoMargenSemanal() {
  // Obtener entradas de inventario (últimas 12 semanas)
  const { data: entradas } = useQuery({
    queryKey: ["entradas-historico"],
    queryFn: async () => {
      const fechaInicio = subWeeks(new Date(), 12);
      const { data, error } = await supabase
        .from("inventario_entradas")
        .select("precio_compra, cantidad, fecha_ingreso")
        .gte("fecha_ingreso", fechaInicio.toISOString().split("T")[0]);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener entradas de insumos (últimas 12 semanas)
  const { data: entradasInsumos } = useQuery({
    queryKey: ["entradas-insumos-historico"],
    queryFn: async () => {
      const fechaInicio = subWeeks(new Date(), 12);
      const { data, error } = await supabase
        .from("inventario_entradas_insumos")
        .select("precio_compra, cantidad, fecha_compra")
        .gte("fecha_compra", fechaInicio.toISOString().split("T")[0]);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener facturas (últimas 12 semanas)
  const { data: facturas } = useQuery({
    queryKey: ["facturas-historico"],
    queryFn: async () => {
      const fechaInicio = subWeeks(new Date(), 12);
      const { data, error } = await supabase
        .from("facturas")
        .select("total, created_at")
        .gte("created_at", fechaInicio.toISOString());
      
      if (error) throw error;
      return data || [];
    },
  });

  // Obtener configuración de alertas para el umbral
  const { data: config } = useQuery({
    queryKey: ["alertas-config-grafico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alertas_rentabilidad_config")
        .select("margen_minimo")
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Calcular datos semanales
  const datosSemanales = useMemo(() => {
    if (!entradas && !entradasInsumos && !facturas) return [];

    const semanas: DatoSemanal[] = [];
    const hoy = new Date();

    // Generar últimas 12 semanas
    for (let i = 11; i >= 0; i--) {
      const fechaRef = subWeeks(hoy, i);
      const inicio = startOfWeek(fechaRef, { weekStartsOn: 1 });
      const fin = endOfWeek(fechaRef, { weekStartsOn: 1 });

      // Calcular inversión de productos
      const inversionProductos = (entradas || [])
        .filter(e => {
          const fecha = parseISO(e.fecha_ingreso);
          return isWithinInterval(fecha, { start: inicio, end: fin });
        })
        .reduce((acc, e) => acc + (e.precio_compra * e.cantidad), 0);

      // Calcular inversión de insumos
      const inversionInsumos = (entradasInsumos || [])
        .filter(e => {
          const fecha = parseISO(e.fecha_compra);
          return isWithinInterval(fecha, { start: inicio, end: fin });
        })
        .reduce((acc, e) => acc + (e.precio_compra * e.cantidad), 0);

      const inversionTotal = inversionProductos + inversionInsumos;

      // Calcular ventas
      const ventasTotal = (facturas || [])
        .filter(f => {
          const fecha = parseISO(f.created_at);
          return isWithinInterval(fecha, { start: inicio, end: fin });
        })
        .reduce((acc, f) => acc + (f.total || 0), 0);

      // Calcular margen
      const margen = ventasTotal > 0 
        ? ((ventasTotal - inversionTotal) / ventasTotal) * 100 
        : 0;

      semanas.push({
        semana: format(inicio, "dd MMM", { locale: es }),
        fechaInicio: format(inicio, "dd/MM/yyyy"),
        fechaFin: format(fin, "dd/MM/yyyy"),
        inversion: inversionTotal,
        ventas: ventasTotal,
        margen: Number(margen.toFixed(1)),
      });
    }

    return semanas;
  }, [entradas, entradasInsumos, facturas]);

  const margenMinimo = config?.margen_minimo || 20;
  
  // Calcular estadísticas
  const margenPromedio = datosSemanales.length > 0
    ? datosSemanales.reduce((acc, d) => acc + d.margen, 0) / datosSemanales.length
    : 0;

  const margenMaximo = datosSemanales.length > 0
    ? Math.max(...datosSemanales.map(d => d.margen))
    : 0;

  const margenMinimoPeriodo = datosSemanales.length > 0
    ? Math.min(...datosSemanales.map(d => d.margen))
    : 0;

  const tendencia = datosSemanales.length >= 2
    ? datosSemanales[datosSemanales.length - 1].margen - datosSemanales[datosSemanales.length - 2].margen
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Evolución del Margen de Rentabilidad
        </CardTitle>
        <CardDescription>
          Histórico semanal de las últimas 12 semanas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Promedio</p>
            <p className={`text-xl font-bold ${margenPromedio >= margenMinimo ? 'text-green-500' : 'text-red-500'}`}>
              {margenPromedio.toFixed(1)}%
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Máximo</p>
            <p className="text-xl font-bold text-green-500">{margenMaximo.toFixed(1)}%</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Mínimo</p>
            <p className={`text-xl font-bold ${margenMinimoPeriodo >= margenMinimo ? 'text-green-500' : 'text-red-500'}`}>
              {margenMinimoPeriodo.toFixed(1)}%
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Tendencia</p>
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className={`w-4 h-4 ${tendencia >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
              <p className={`text-xl font-bold ${tendencia >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {tendencia >= 0 ? '+' : ''}{tendencia.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico */}
        {datosSemanales.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={datosSemanales} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <defs>
                  <linearGradient id="margenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="semana" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                  domain={['auto', 'auto']}
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DatoSemanal;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium text-sm mb-2">
                            Semana {data.fechaInicio} - {data.fechaFin}
                          </p>
                          <div className="space-y-1 text-sm">
                            <p className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Margen:</span>
                              <span className={`font-bold ${data.margen >= margenMinimo ? 'text-green-500' : 'text-red-500'}`}>
                                {data.margen}%
                              </span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Ventas:</span>
                              <span className="font-medium">${data.ventas.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Inversión:</span>
                              <span className="font-medium">${data.inversion.toLocaleString()}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine 
                  y={margenMinimo} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: `Mínimo ${margenMinimo}%`, 
                    position: 'right',
                    fill: 'hsl(var(--destructive))',
                    fontSize: 11
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="margen"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#margenGradient)"
                  strokeWidth={0}
                />
                <Line
                  type="monotone"
                  dataKey="margen"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            No hay datos históricos disponibles
          </div>
        )}

        {/* Leyenda */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" />
            <span className="text-muted-foreground">Margen de rentabilidad</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-destructive" style={{ borderStyle: 'dashed' }} />
            <span className="text-muted-foreground">Umbral mínimo ({margenMinimo}%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
