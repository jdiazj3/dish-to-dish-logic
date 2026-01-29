import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ChefHat, CheckCircle2, Bell } from "lucide-react";

interface OrdenTurno {
  id: string;
  numero_orden: number;
  estado: string;
  nombre_cliente: string | null;
  mesa: {
    numero: number;
    salon: {
      nombre: string;
    } | null;
  } | null;
}

function ColumnaEstado({
  titulo,
  ordenes,
  icono: Icono,
  colorClase,
  bgClase,
}: {
  titulo: string;
  ordenes: OrdenTurno[];
  icono: typeof Clock;
  colorClase: string;
  bgClase: string;
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className={`${bgClase} p-6 rounded-t-3xl`}>
        <div className="flex items-center justify-center gap-4">
          <Icono className={`w-12 h-12 ${colorClase}`} />
          <h2 className={`text-4xl font-bold ${colorClase}`}>{titulo}</h2>
          <div className={`${colorClase} text-4xl font-bold bg-white/20 px-4 py-2 rounded-full`}>
            {ordenes.length}
          </div>
        </div>
      </div>
      <div className={`flex-1 ${bgClase} bg-opacity-20 p-6 space-y-4 overflow-y-auto`}>
        {ordenes.length === 0 ? (
          <div className="text-center text-muted-foreground text-2xl py-12">
            Sin órdenes
          </div>
        ) : (
          ordenes.map((orden) => (
            <div
              key={orden.id}
              className={`${bgClase} rounded-2xl p-6 shadow-lg transform transition-all hover:scale-102`}
            >
              <div className="flex items-center justify-between">
                <div className={`text-6xl font-black ${colorClase}`}>
                  #{orden.numero_orden}
                </div>
                {orden.mesa && (
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-foreground">
                      Mesa {orden.mesa.numero}
                    </div>
                    {orden.mesa.salon && (
                      <div className="text-lg text-muted-foreground">
                        {orden.mesa.salon.nombre}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {orden.nombre_cliente && (
                <div className="mt-3 text-xl text-muted-foreground truncate">
                  {orden.nombre_cliente}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function PantallaTurnos() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: ordenes = [] } = useQuery({
    queryKey: ['ordenes-turnos'],
    queryFn: async () => {
      // Filtrar solo órdenes de hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          id,
          numero_orden,
          estado,
          nombre_cliente,
          mesa:mesas(
            numero,
            salon:salones(nombre)
          )
        `)
        .in('estado', ['recibida', 'tomada', 'entregada'])
        .gte('created_at', hoy.toISOString())
        .order('numero_orden', { ascending: true });

      if (error) throw error;
      return data as OrdenTurno[];
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('turnos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordenes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ordenes-turnos'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const ordenesRecibidas = ordenes.filter(o => o.estado === 'recibida');
  const ordenesEnPreparacion = ordenes.filter(o => o.estado === 'tomada');
  const ordenesListas = ordenes.filter(o => o.estado === 'entregada');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Bell className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Estado de Órdenes</h1>
          </div>
          <div className="text-3xl font-mono">
            {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Columnas de estados */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <ColumnaEstado
          titulo="Recibidas"
          ordenes={ordenesRecibidas}
          icono={Clock}
          colorClase="text-amber-700"
          bgClase="bg-amber-100"
        />
        <ColumnaEstado
          titulo="En Preparación"
          ordenes={ordenesEnPreparacion}
          icono={ChefHat}
          colorClase="text-blue-700"
          bgClase="bg-blue-100"
        />
        <ColumnaEstado
          titulo="¡Listas!"
          ordenes={ordenesListas}
          icono={CheckCircle2}
          colorClase="text-green-700"
          bgClase="bg-green-100"
        />
      </div>

      {/* Footer con instrucciones */}
      <footer className="bg-muted p-4 text-center">
        <p className="text-xl text-muted-foreground">
          Por favor espere a que su número aparezca en <span className="font-bold text-green-600">¡Listas!</span> para recoger su pedido
        </p>
      </footer>
    </div>
  );
}
