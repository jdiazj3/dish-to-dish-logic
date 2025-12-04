import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock } from "lucide-react";
import { startOfDay, endOfDay, format } from "date-fns";

export function GraficoVentasPorHora() {
  const queryClient = useQueryClient();

  const { data: ventasPorHora, isLoading } = useQuery({
    queryKey: ['ventas-por-hora-hoy'],
    queryFn: async () => {
      const hoy = new Date();
      const inicio = startOfDay(hoy).toISOString();
      const fin = endOfDay(hoy).toISOString();

      const { data, error } = await supabase
        .from('facturas')
        .select('created_at, total')
        .gte('created_at', inicio)
        .lte('created_at', fin);

      if (error) throw error;

      // Agrupar por hora
      const horasData: { [key: string]: number } = {};
      
      // Inicializar todas las horas de operación (8am - 11pm)
      for (let i = 8; i <= 23; i++) {
        const horaKey = i.toString().padStart(2, '0');
        horasData[horaKey] = 0;
      }

      // Sumar ventas por hora
      data?.forEach((factura) => {
        const hora = format(new Date(factura.created_at), 'HH');
        if (horasData[hora] !== undefined) {
          horasData[hora] += parseFloat(String(factura.total));
        }
      });

      // Convertir a array para el gráfico
      return Object.entries(horasData).map(([hora, total]) => ({
        hora: `${hora}:00`,
        ventas: total,
      }));
    },
  });

  // Suscripción en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('facturas-grafico-hora')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'facturas',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ventas-por-hora-hoy'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Ventas por Hora - Hoy
        </CardTitle>
        <CardDescription>Distribución de ventas durante el día</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Cargando gráfico...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ventasPorHora} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="hora" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString('es-CO')}`, 'Ventas']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="ventas" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
