import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface VentasPorPeriodoProps {
  data: Array<{
    fecha: string;
    ventas: number;
    ordenes: number;
  }>;
}

const chartConfig = {
  ventas: {
    label: "Ventas",
    color: "hsl(var(--primary))",
  },
  ordenes: {
    label: "Órdenes",
    color: "hsl(var(--secondary))",
  },
};

export function VentasPorPeriodo({ data }: VentasPorPeriodoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por Período</CardTitle>
        <CardDescription>Evolución de ventas y órdenes en el tiempo</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="fecha" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line type="monotone" dataKey="ventas" stroke="var(--color-ventas)" strokeWidth={2} name="Ventas ($)" />
              <Line type="monotone" dataKey="ordenes" stroke="var(--color-ordenes)" strokeWidth={2} name="Órdenes" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
