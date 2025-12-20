import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, CalendarIcon } from "lucide-react";
import { startOfDay, endOfDay, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { formatCOP } from "@/utils/formatCurrency";

export function GraficoVentasPorHora() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const { data: ventasPorHora, isLoading } = useQuery({
    queryKey: ['ventas-por-hora', dateRange?.from, dateRange?.to],
    queryFn: async () => {
      const inicio = startOfDay(dateRange?.from || new Date()).toISOString();
      const fin = endOfDay(dateRange?.to || dateRange?.from || new Date()).toISOString();

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
          queryClient.invalidateQueries({ queryKey: ['ventas-por-hora'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const formatDateRange = () => {
    if (!dateRange?.from) return "Seleccionar fechas";
    if (!dateRange.to || dateRange.from.toDateString() === dateRange.to.toDateString()) {
      return format(dateRange.from, "d MMM yyyy", { locale: es });
    }
    return `${format(dateRange.from, "d MMM", { locale: es })} - ${format(dateRange.to, "d MMM yyyy", { locale: es })}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Ventas por Hora
            </CardTitle>
            <CardDescription>Distribución de ventas durante el día</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                locale={es}
                disabled={(date) => date > new Date()}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
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
                formatter={(value: number) => [formatCOP(value), 'Ventas']}
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
