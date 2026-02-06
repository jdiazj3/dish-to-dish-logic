import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCOP } from "@/utils/formatCurrency";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

export function GraficoFlujoSemanal() {
  const { data: datosGrafico = [] } = useQuery({
    queryKey: ['flujo-semanal'],
    queryFn: async () => {
      const dias = [];
      const hoy = new Date();

      // Obtener datos de los últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const fecha = subDays(hoy, i);
        const fechaStr = format(fecha, 'yyyy-MM-dd');

        // Obtener ventas del día
        const { data: facturas } = await supabase
          .from('facturas')
          .select('total')
          .gte('created_at', startOfDay(fecha).toISOString())
          .lte('created_at', endOfDay(fecha).toISOString());

        const ventas = facturas?.reduce((sum, f) => sum + Number(f.total), 0) || 0;

        // Obtener movimientos del día
        const { data: movimientos } = await supabase
          .from('movimientos_caja')
          .select('tipo, monto')
          .eq('fecha_movimiento', fechaStr)
          .eq('estado', 'aprobado');

        const entradas = movimientos?.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + Number(m.monto), 0) || 0;
        const salidas = movimientos?.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + Number(m.monto), 0) || 0;

        dias.push({
          dia: format(fecha, 'EEE', { locale: es }),
          fecha: format(fecha, 'dd/MM'),
          entradas: ventas + entradas,
          salidas: salidas
        });
      }

      return dias;
    }
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCOP(entry.value)}
            </p>
          ))}
          <p className="text-sm font-medium mt-2 pt-2 border-t">
            Balance: {formatCOP(payload[0]?.value - payload[1]?.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flujo de Caja - Últimos 7 días</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafico}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="dia" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="entradas" 
                name="Entradas" 
                fill="hsl(var(--chart-2))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="salidas" 
                name="Salidas" 
                fill="hsl(var(--chart-1))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
