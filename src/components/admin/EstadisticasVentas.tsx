import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { startOfDay, endOfDay } from "date-fns";
import { formatCOP } from "@/utils/formatCurrency";

export function EstadisticasVentas() {
  const { data: stats } = useQuery({
    queryKey: ['estadisticas-ventas-hoy'],
    queryFn: async () => {
      const hoy = new Date();
      const inicioHoy = startOfDay(hoy).toISOString();
      const finHoy = endOfDay(hoy).toISOString();

      // Total ventas del día
      const { data: facturas } = await supabase
        .from('facturas')
        .select('total')
        .gte('created_at', inicioHoy)
        .lte('created_at', finHoy);

      const ventasHoy = facturas?.reduce((sum, f) => sum + Number(f.total), 0) || 0;
      const numFacturas = facturas?.length || 0;

      // Órdenes activas (no entregadas)
      const { data: ordenesActivas } = await supabase
        .from('ordenes')
        .select('id')
        .neq('estado', 'entregada');

      // Total productos en el menú
      const { data: productos } = await supabase
        .from('productos')
        .select('id')
        .eq('disponible', true);

      return {
        ventasHoy,
        numFacturas,
        ordenesActivas: ordenesActivas?.length || 0,
        productosDisponibles: productos?.length || 0,
        promedioTicket: numFacturas > 0 ? ventasHoy / numFacturas : 0,
      };
    },
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  const tarjetas = [
    {
      titulo: "Ventas Hoy",
      valor: formatCOP(stats?.ventasHoy || 0),
      descripcion: `${stats?.numFacturas || 0} facturas emitidas`,
      icono: DollarSign,
      color: "text-green-600",
    },
    {
      titulo: "Órdenes Activas",
      valor: stats?.ordenesActivas || 0,
      descripcion: "En proceso y preparación",
      icono: ShoppingCart,
      color: "text-blue-600",
    },
    {
      titulo: "Ticket Promedio",
      valor: formatCOP(stats?.promedioTicket || 0),
      descripcion: "Por factura",
      icono: TrendingUp,
      color: "text-purple-600",
    },
    {
      titulo: "Productos Disponibles",
      valor: stats?.productosDisponibles || 0,
      descripcion: "En el menú actual",
      icono: Users,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {tarjetas.map((tarjeta, index) => {
        const Icono = tarjeta.icono;
        return (
          <Card key={index} className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {tarjeta.titulo}
              </CardTitle>
              <Icono className={`h-4 w-4 ${tarjeta.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tarjeta.valor}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {tarjeta.descripcion}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
