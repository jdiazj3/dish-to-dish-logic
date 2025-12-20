import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP as formatCurrency } from "@/utils/formatCurrency";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Wallet, Package } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

interface ReporteRentabilidadProps {
  totalInversion: number;
  totalVentas: number;
  ganancia: number;
  margenGanancia: number;
  detalleInversion: {
    productos: number;
    insumos: number;
  };
  inversionPorDia: Array<{
    fecha: string;
    inversion: number;
    ventas: number;
    ganancia: number;
  }>;
}

const chartConfig = {
  inversion: {
    label: "Inversión",
    color: "hsl(var(--chart-1))",
  },
  ventas: {
    label: "Ventas",
    color: "hsl(var(--chart-2))",
  },
  ganancia: {
    label: "Ganancia",
    color: "hsl(var(--chart-3))",
  },
};

export function ReporteRentabilidad({
  totalInversion,
  totalVentas,
  ganancia,
  margenGanancia,
  detalleInversion,
  inversionPorDia,
}: ReporteRentabilidadProps) {
  const esRentable = ganancia >= 0;

  const dataPie = [
    { name: "Productos", value: detalleInversion.productos, fill: "hsl(var(--chart-1))" },
    { name: "Insumos", value: detalleInversion.insumos, fill: "hsl(var(--chart-4))" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Resumen Principal */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Wallet className="w-6 h-6 text-primary" />
            Resumen de Rentabilidad
          </CardTitle>
          <CardDescription>
            Comparación entre inversión en inventario y ventas del período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Inversión Total */}
            <div className="bg-card rounded-lg p-4 border shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ShoppingCart className="w-4 h-4" />
                <span className="text-sm font-medium">Invertí</span>
              </div>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(totalInversion)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Compras de inventario
              </p>
            </div>

            {/* Ventas Totales */}
            <div className="bg-card rounded-lg p-4 border shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Vendí</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(totalVentas)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total facturado
              </p>
            </div>

            {/* Ganancia */}
            <div className={`bg-card rounded-lg p-4 border shadow-sm ${esRentable ? 'border-green-500/30' : 'border-red-500/30'}`}>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {esRentable ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {esRentable ? 'Gané' : 'Perdí'}
                </span>
              </div>
              <p className={`text-2xl font-bold ${esRentable ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(Math.abs(ganancia))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ventas - Inversión
              </p>
            </div>

            {/* Margen de Ganancia */}
            <div className="bg-card rounded-lg p-4 border shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="w-4 h-4" />
                <span className="text-sm font-medium">Margen</span>
              </div>
              <p className={`text-2xl font-bold ${margenGanancia >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {margenGanancia.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Rentabilidad
              </p>
            </div>
          </div>

          {/* Mensaje Resumen */}
          <div className={`mt-6 p-4 rounded-lg ${esRentable ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            <p className={`text-center font-medium ${esRentable ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {esRentable 
                ? `¡Excelente! Invertiste ${formatCurrency(totalInversion)}, vendiste ${formatCurrency(totalVentas)} y obtuviste una ganancia de ${formatCurrency(ganancia)} (${margenGanancia.toFixed(1)}% de margen)`
                : `Atención: Invertiste ${formatCurrency(totalInversion)}, vendiste ${formatCurrency(totalVentas)} resultando en una pérdida de ${formatCurrency(Math.abs(ganancia))}`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Barras - Comparativa por Día */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inversión vs Ventas por Día</CardTitle>
            <CardDescription>Comparativa diaria del período</CardDescription>
          </CardHeader>
          <CardContent>
            {inversionPorDia.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inversionPorDia}>
                    <XAxis 
                      dataKey="fecha" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      }
                    />
                    <Bar 
                      dataKey="inversion" 
                      name="Inversión"
                      fill="hsl(var(--chart-1))" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="ventas" 
                      name="Ventas"
                      fill="hsl(var(--chart-2))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos para el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Torta - Distribución de Inversión */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Inversión</CardTitle>
            <CardDescription>Productos vs Insumos</CardDescription>
          </CardHeader>
          <CardContent>
            {dataPie.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      labelLine={false}
                    >
                      {dataPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos de inversión
              </div>
            )}

            {/* Detalle de inversión */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Productos para venta:</span>
                <span className="font-medium">{formatCurrency(detalleInversion.productos)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Insumos del restaurante:</span>
                <span className="font-medium">{formatCurrency(detalleInversion.insumos)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
