import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { formatCOP } from "@/utils/formatCurrency";
import { AlertTriangle } from "lucide-react";
import type { GastoCategoria, ProductoRentable } from "@/hooks/useIndicadoresFinancieros";

interface Props {
  cmv: number;
  gastosFijos: number;
  gastosVariables: number;
  utilidadOperativa: number;
  gastosPorCategoria: GastoCategoria[];
  productos: ProductoRentable[];
  margenMinimo: number;
}

export function EstructuraCostos({
  cmv,
  gastosFijos,
  gastosVariables,
  utilidadOperativa,
  gastosPorCategoria,
  productos,
  margenMinimo,
}: Props) {
  const data = [
    { name: "Costo de insumos", value: cmv, fill: "hsl(var(--chart-1))" },
    { name: "Gastos fijos", value: gastosFijos, fill: "hsl(var(--chart-4))" },
    { name: "Gastos variables", value: gastosVariables, fill: "hsl(var(--chart-3))" },
    { name: "Ganancia", value: Math.max(0, utilidadOperativa), fill: "hsl(var(--chart-2))" },
  ].filter((d) => d.value > 0);

  const fugas = productos
    .filter((p) => p.margen < margenMinimo && p.cantidad > 0)
    .map((p) => ({ ...p, perdida: (margenMinimo / 100) * p.ventas - p.ganancia }))
    .sort((a, b) => b.perdida - a.perdida)
    .slice(0, 6);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">En qué se va la plata</CardTitle>
          <CardDescription>Estructura de costos y gastos sobre las ventas</CardDescription>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <ChartContainer config={{}} className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4}>
                    {data.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Legend />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v: number) => formatCOP(v)} />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground">
              Sin datos del período
            </div>
          )}

          <div className="mt-4 space-y-1">
            {gastosPorCategoria.slice(0, 5).map((g) => (
              <div key={g.categoria} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {g.categoria} {g.esFijo ? "(fijo)" : ""}
                </span>
                <span className="font-medium">{formatCOP(g.total)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Dónde se está yendo el margen
          </CardTitle>
          <CardDescription>
            Platos vendidos por debajo del {margenMinimo}% de margen, ordenados por cuánto te cuestan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fugas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todos los platos vendidos están por encima del margen mínimo. 
            </p>
          ) : (
            <div className="space-y-2">
              {fugas.map((p) => (
                <div key={p.producto_id} className="flex items-center justify-between rounded-md bg-red-500/5 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.cantidad} vendidos · margen {p.margen.toFixed(1)}%
                    </p>
                  </div>
                  <p className="ml-3 text-sm font-semibold text-red-600">−{formatCOP(p.perdida)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
