import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

export function GraficoVentasPorDia() {
  const { data: ventasPorDia, isLoading } = useQuery({
    queryKey: ['ventas-por-dia'],
    queryFn: async () => {
      const dias = 7;
      const datos = [];

      for (let i = dias - 1; i >= 0; i--) {
        const fecha = subDays(new Date(), i);
        const inicioDia = new Date(fecha.setHours(0, 0, 0, 0)).toISOString();
        const finDia = new Date(fecha.setHours(23, 59, 59, 999)).toISOString();

        const { data: facturas } = await supabase
          .from('facturas')
          .select('total')
          .gte('created_at', inicioDia)
          .lte('created_at', finDia);

        const total = facturas?.reduce((sum, f) => sum + Number(f.total), 0) || 0;

        datos.push({
          fecha: format(fecha, 'EEE dd', { locale: es }),
          total: Math.round(total),
        });
      }

      return datos;
    },
    refetchInterval: 60000, // Actualizar cada minuto
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas de los Últimos 7 Días</CardTitle>
        <CardDescription>Evolución diaria de las ventas</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventasPorDia}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="fecha" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Ventas']}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
