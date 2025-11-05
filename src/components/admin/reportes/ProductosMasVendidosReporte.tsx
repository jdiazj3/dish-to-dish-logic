import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface ProductosMasVendidosReporteProps {
  data: Array<{
    nombre: string;
    cantidad: number;
    total: number;
  }>;
  tipo: "mas" | "menos";
}

const chartConfig = {
  cantidad: {
    label: "Cantidad Vendida",
    color: "hsl(var(--primary))",
  },
};

export function ProductosMasVendidosReporte({ data, tipo }: ProductosMasVendidosReporteProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos {tipo === "mas" ? "Más" : "Menos"} Vendidos</CardTitle>
        <CardDescription>Top 10 productos por cantidad vendida</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="nombre" type="category" width={150} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="cantidad" fill="var(--color-cantidad)" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
