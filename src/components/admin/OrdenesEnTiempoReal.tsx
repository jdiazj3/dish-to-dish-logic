import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChefHat, CheckCircle2 } from "lucide-react";

export function OrdenesEnTiempoReal() {
  const queryClient = useQueryClient();

  const { data: ordenesPorEstado } = useQuery({
    queryKey: ['ordenes-por-estado'],
    queryFn: async () => {
      const { data: ordenes } = await supabase
        .from('ordenes')
        .select('estado')
        .neq('estado', 'entregada');

      const estados = {
        recibida: 0,
        en_preparacion: 0,
        lista: 0,
      };

      ordenes?.forEach(orden => {
        if (orden.estado in estados) {
          estados[orden.estado as keyof typeof estados]++;
        }
      });

      return estados;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('ordenes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordenes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ordenes-por-estado'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const estados = [
    {
      titulo: "Recibidas",
      valor: ordenesPorEstado?.recibida || 0,
      descripcion: "Esperando cocina",
      icono: Clock,
      color: "bg-yellow-500",
    },
    {
      titulo: "En Preparación",
      valor: ordenesPorEstado?.en_preparacion || 0,
      descripcion: "En cocina",
      icono: ChefHat,
      color: "bg-blue-500",
    },
    {
      titulo: "Listas",
      valor: ordenesPorEstado?.lista || 0,
      descripcion: "Para entregar",
      icono: CheckCircle2,
      color: "bg-green-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Órdenes en Tiempo Real</CardTitle>
        <CardDescription>Estado actual de las órdenes activas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {estados.map((estado, index) => {
            const Icono = estado.icono;
            return (
              <div
                key={index}
                className="flex flex-col items-center p-4 border rounded-lg bg-card"
              >
                <div className={`p-3 rounded-full ${estado.color} mb-3`}>
                  <Icono className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold">{estado.valor}</div>
                <div className="text-sm font-medium mt-1">{estado.titulo}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {estado.descripcion}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
