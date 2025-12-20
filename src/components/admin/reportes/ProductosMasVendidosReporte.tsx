import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { formatCOP } from "@/utils/formatCurrency";

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
  total: {
    label: "Total Ventas",
    color: "hsl(var(--secondary))",
  },
};

export function ProductosMasVendidosReporte({ data, tipo }: ProductosMasVendidosReporteProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos {tipo === "mas" ? "Más" : "Menos"} Vendidos</CardTitle>
        <CardDescription>Top 10 productos por cantidad vendida y total de ventas</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="nombre" type="category" width={150} className="text-xs" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: any, name: string) => [
                  name === 'total' ? formatCOP(value) : value,
                  name === 'total' ? 'Total Ventas' : 'Cantidad'
                ]}
              />
              <Legend />
              <Bar dataKey="cantidad" fill="var(--color-cantidad)" name="Cantidad" />
              <Bar dataKey="total" fill="var(--color-total)" name="Total Ventas ($)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
