import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface AnalisisPorTurnoProps {
  data: Array<{
    turno: string;
    ordenes: number;
    total: number;
  }>;
}

const COLORS = {
  manana: "hsl(var(--primary))",
  tarde: "hsl(var(--secondary))",
  noche: "hsl(var(--accent))",
};

const chartConfig = {
  manana: {
    label: "Mañana",
    color: COLORS.manana,
  },
  tarde: {
    label: "Tarde",
    color: COLORS.tarde,
  },
  noche: {
    label: "Noche",
    color: COLORS.noche,
  },
};

export function AnalisisPorTurno({ data }: AnalisisPorTurnoProps) {
  const chartData = data.map((item) => ({
    ...item,
    fill: COLORS[item.turno as keyof typeof COLORS] || COLORS.manana,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis por Turno</CardTitle>
        <CardDescription>Distribución de ventas por turno de trabajo</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="turno"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `$${entry.total.toLocaleString()}`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
