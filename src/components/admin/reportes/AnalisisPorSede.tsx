import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { formatCOP } from "@/utils/formatCurrency";

interface AnalisisPorSedeProps {
  data: Array<{
    sede: string;
    ordenes: number;
    total: number;
  }>;
}

const chartConfig = {
  ordenes: {
    label: "Órdenes",
    color: "hsl(var(--primary))",
  },
  total: {
    label: "Ventas ($)",
    color: "hsl(var(--secondary))",
  },
};

export function AnalisisPorSede({ data }: AnalisisPorSedeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis por Sede</CardTitle>
        <CardDescription>Comparativa de desempeño entre sedes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="sede" className="text-xs" />
              <YAxis 
                className="text-xs"
                tickFormatter={(value) => formatCOP(value)}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: any, name: string) => [
                  name === 'total' ? formatCOP(value) : value,
                  name === 'total' ? 'Ventas' : 'Órdenes'
                ]}
              />
              <Legend />
              <Bar dataKey="ordenes" fill="var(--color-ordenes)" name="Órdenes" />
              <Bar dataKey="total" fill="var(--color-total)" name="Ventas ($)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
