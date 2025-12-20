import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, PieChartIcon } from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatCOP } from "@/utils/formatCurrency";

const COLORS = {
  efectivo: '#22c55e',  // green
  debito: '#3b82f6',    // blue
  credito: '#a855f7',   // purple
  nequi: '#E6007E',     // nequi pink
  daviplata: '#ED1C24', // daviplata red
};

const LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  debito: 'Tarjeta Débito',
  credito: 'Tarjeta Crédito',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
};

export function ReporteMetodosPago() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data: reporteData, isLoading } = useQuery({
    queryKey: ['reporte-metodos-pago', dateRange.from, dateRange.to],
    queryFn: async () => {
      const inicio = startOfDay(dateRange.from).toISOString();
      const fin = endOfDay(dateRange.to).toISOString();

      const { data, error } = await supabase
        .from('facturas')
        .select('total, metodo_pago')
        .gte('created_at', inicio)
        .lte('created_at', fin);

      if (error) throw error;

      // Agrupar por método de pago
      const totales: Record<string, { total: number; cantidad: number }> = {
        efectivo: { total: 0, cantidad: 0 },
        debito: { total: 0, cantidad: 0 },
        credito: { total: 0, cantidad: 0 },
        nequi: { total: 0, cantidad: 0 },
        daviplata: { total: 0, cantidad: 0 },
      };

      data?.forEach(factura => {
        const metodo = factura.metodo_pago || 'efectivo';
        if (totales[metodo]) {
          totales[metodo].total += parseFloat(String(factura.total));
          totales[metodo].cantidad += 1;
        }
      });

      const chartData = Object.entries(totales)
        .filter(([_, value]) => value.total > 0)
        .map(([key, value]) => ({
          name: LABELS[key],
          value: value.total,
          cantidad: value.cantidad,
          metodo: key,
        }));

      const totalGeneral = Object.values(totales).reduce((sum, v) => sum + v.total, 0);
      const totalFacturas = Object.values(totales).reduce((sum, v) => sum + v.cantidad, 0);

      return { chartData, totales, totalGeneral, totalFacturas };
    },
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const porcentaje = reporteData?.totalGeneral 
        ? ((data.value / reporteData.totalGeneral) * 100).toFixed(1) 
        : 0;
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.cantidad} facturas</p>
          <p className="font-bold">{formatCOP(data.value)}</p>
          <p className="text-xs text-muted-foreground">{porcentaje}% del total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Ventas por Método de Pago
            </CardTitle>
            <CardDescription>Distribución de ventas según forma de pago</CardDescription>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "dd MMM", { locale: es })} - {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  locale={es}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Cargando datos...
          </div>
        ) : reporteData?.chartData && reporteData.chartData.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Gráfico de torta */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reporteData.chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {reporteData.chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[entry.metodo as keyof typeof COLORS] || '#888888'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Resumen detallado */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Período</p>
                <p className="text-3xl font-bold">
                  {formatCOP(reporteData.totalGeneral)}
                </p>
                <p className="text-sm text-muted-foreground">{reporteData.totalFacturas} facturas</p>
              </div>

              <div className="space-y-3">
                {Object.entries(reporteData.totales)
                  .filter(([_, value]) => value.total > 0)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([metodo, data]) => {
                    const porcentaje = (data.total / reporteData.totalGeneral) * 100;
                    return (
                      <div key={metodo} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[metodo as keyof typeof COLORS] }}
                          />
                          <div>
                            <p className="font-medium">{LABELS[metodo]}</p>
                            <p className="text-xs text-muted-foreground">{data.cantidad} facturas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCOP(data.total)}</p>
                          <p className="text-xs text-muted-foreground">{porcentaje.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos para el período seleccionado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
