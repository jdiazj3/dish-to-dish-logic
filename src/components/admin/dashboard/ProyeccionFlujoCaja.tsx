import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, ResponsiveContainer, ReferenceLine, XAxis, YAxis } from "recharts";
import { formatCOP } from "@/utils/formatCurrency";
import { addDays, format, parseISO } from "date-fns";

interface Props {
  ventaDiariaPromedio: number;
}

export function ProyeccionFlujoCaja({ ventaDiariaPromedio }: Props) {
  const { data: cuentas } = useQuery({
    queryKey: ["proyeccion", "cuentas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cuentas_flujo").select("saldo_actual, activa");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: programados } = useQuery({
    queryKey: ["proyeccion", "gastos-programados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gastos_recurrentes")
        .select("nombre, monto_estimado, proximo_pago, activo")
        .eq("activo", true);
      if (error) throw error;
      return data || [];
    },
  });

  const { serie, minimo } = useMemo(() => {
    const saldoInicial = (cuentas || [])
      .filter((c) => c.activa !== false)
      .reduce((a, c) => a + Number(c.saldo_actual || 0), 0);

    let saldo = saldoInicial;
    const hoy = new Date();
    const filas = [] as Array<{ fecha: string; saldo: number }>;

    for (let i = 0; i <= 30; i++) {
      const dia = addDays(hoy, i);
      if (i > 0) saldo += ventaDiariaPromedio;
      (programados || []).forEach((g) => {
        if (!g.proximo_pago) return;
        if (format(parseISO(g.proximo_pago as string), "yyyy-MM-dd") === format(dia, "yyyy-MM-dd")) {
          saldo -= Number(g.monto_estimado || 0);
        }
      });
      filas.push({ fecha: format(dia, "dd/MM"), saldo: Math.round(saldo) });
    }

    return { serie: filas, minimo: Math.min(...filas.map((f) => f.saldo)) };
  }, [cuentas, programados, ventaDiariaPromedio]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cómo va tu caja los próximos 30 días</CardTitle>
        <CardDescription>
          Saldo actual más ventas estimadas, menos los pagos programados que vienen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie}>
              <XAxis dataKey="fecha" fontSize={11} tickLine={false} axisLine={false} interval={4} />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
              <ChartTooltip content={<ChartTooltipContent formatter={(v: number) => formatCOP(v)} />} />
              <Area
                type="monotone"
                dataKey="saldo"
                name="Saldo"
                stroke="hsl(var(--chart-2))"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
        {minimo < 0 && (
          <p className="mt-3 text-sm font-medium text-red-600">
            Atención: con el ritmo actual tu caja quedaría en negativo (hasta {formatCOP(minimo)}).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
