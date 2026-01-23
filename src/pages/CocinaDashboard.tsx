import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Clock, CheckCircle2, Package, Bell, BellOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OrdenCard } from "@/components/OrdenCard";

// Sonido para pedidos internos - tono agudo clásico
const playInternalOrderSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Tono clásico "ding-ding" para pedidos internos
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
    
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.setValueAtTime(1100, audioContext.currentTime);
      osc2.type = 'sine';
      
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.4);
    }, 120);
    
  } catch (error) {
    console.error('Error playing internal order sound:', error);
  }
};

// Sonido para domicilios - tono más grave y prolongado tipo "alarma urgente"
const playDeliveryOrderSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Primer tono grave
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator1.type = 'triangle';
    
    gainNode1.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.3);
    
    // Segundo tono más agudo
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.setValueAtTime(660, audioContext.currentTime);
      osc2.type = 'triangle';
      
      gain2.gain.setValueAtTime(0.4, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.3);
    }, 200);
    
    // Tercer tono aún más agudo
    setTimeout(() => {
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      
      osc3.connect(gain3);
      gain3.connect(audioContext.destination);
      
      osc3.frequency.setValueAtTime(880, audioContext.currentTime);
      osc3.type = 'triangle';
      
      gain3.gain.setValueAtTime(0.4, audioContext.currentTime);
      gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      osc3.start(audioContext.currentTime);
      osc3.stop(audioContext.currentTime + 0.4);
    }, 400);
    
  } catch (error) {
    console.error('Error playing delivery order sound:', error);
  }
};
export default function CocinaDashboard() {
  const { user, signOut } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const queryClient = useQueryClient();
  const [turnoActual, setTurnoActual] = useState<'manana' | 'tarde' | 'noche'>('manana');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    const hora = new Date().getHours();
    if (hora < 12) setTurnoActual('manana');
    else if (hora < 18) setTurnoActual('tarde');
    else setTurnoActual('noche');
  }, []);

  const { data: ordenesRecibidas } = useQuery({
    queryKey: ['ordenes-recibidas', turnoActual],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*, numero_orden, es_domicilio, instrucciones_entrega, nombre_cliente, mesas(numero, salones(nombre)), orden_productos(*, productos(nombre))')
        .eq('estado', 'recibida')
        .eq('turno', turnoActual)
        .order('numero_orden', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: ordenesTomadas } = useQuery({
    queryKey: ['ordenes-tomadas', turnoActual],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*, numero_orden, es_domicilio, instrucciones_entrega, nombre_cliente, mesas(numero, salones(nombre)), orden_productos(*, productos(nombre))')
        .eq('estado', 'tomada')
        .eq('turno', turnoActual)
        .order('numero_orden', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: ordenesEntregadas } = useQuery({
    queryKey: ['ordenes-entregadas', turnoActual],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*, numero_orden, es_domicilio, instrucciones_entrega, nombre_cliente, mesas(numero, salones(nombre)), orden_productos(*, productos(nombre))')
        .eq('estado', 'entregada')
        .eq('turno', turnoActual)
        .order('numero_orden', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Handler para nueva orden recibida con sonido diferenciado
  const handleNewOrder = useCallback((payload: any) => {
    const newOrder = payload.new;
    
    // Solo notificar si es una orden nueva en estado 'recibida'
    if (newOrder.estado === 'recibida' && lastOrderIdRef.current !== newOrder.id) {
      lastOrderIdRef.current = newOrder.id;
      
      if (soundEnabled) {
        if (newOrder.es_domicilio) {
          playDeliveryOrderSound();
        } else {
          playInternalOrderSound();
        }
      }
      
      const tipoOrden = newOrder.es_domicilio ? '🚚 Domicilio' : '🍽️ Mesa';
      toast.success(`Nueva orden ${tipoOrden}`, {
        description: `Orden #${newOrder.numero_orden}`,
        duration: 5000,
      });
    }
  }, [soundEnabled]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('ordenes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ordenes'
        },
        (payload) => {
          handleNewOrder(payload);
          queryClient.invalidateQueries({ queryKey: ['ordenes-recibidas'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ordenes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ordenes-recibidas'] });
          queryClient.invalidateQueries({ queryKey: ['ordenes-tomadas'] });
          queryClient.invalidateQueries({ queryKey: ['ordenes-entregadas'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, handleNewOrder]);

  const tomarOrdenMutation = useMutation({
    mutationFn: async (ordenId: string) => {
      const { error } = await supabase
        .from('ordenes')
        .update({ 
          estado: 'tomada',
          cocinero_id: user?.id 
        })
        .eq('id', ordenId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-recibidas'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-tomadas'] });
      toast.success("Orden tomada");
    },
  });

  const entregarOrdenMutation = useMutation({
    mutationFn: async (ordenId: string) => {
      const { error } = await supabase
        .from('ordenes')
        .update({ estado: 'entregada' })
        .eq('id', ordenId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-tomadas'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-entregadas'] });
      toast.success("Orden entregada");
    },
  });

  // Esperar a que terminen de cargar los roles completamente
  if (isLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!roles?.includes('cocina')) {
    return <Navigate to="/" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Ancestrale - Cocina</h1>
              <p className="text-sm text-muted-foreground">Sistema de órdenes</p>
            </div>
            {ordenesRecibidas && ordenesRecibidas.length > 0 && (
              <Badge 
                variant="destructive" 
                className="animate-pulse text-base px-3 py-1"
              >
                <Clock className="w-4 h-4 mr-1" />
                {ordenesRecibidas.length} nueva{ordenesRecibidas.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              variant={soundEnabled ? "default" : "outline"}
              size="sm"
              title={soundEnabled ? "Sonido activado" : "Sonido desactivado"}
            >
              {soundEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="recibidas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recibidas">
              <Clock className="w-4 h-4 mr-2" />
              Recibidas
              <Badge className="ml-2" variant="destructive">
                {ordenesRecibidas?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tomadas">
              <Package className="w-4 h-4 mr-2" />
              En Preparación
              <Badge className="ml-2" variant="secondary">
                {ordenesTomadas?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="entregadas">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Entregadas
              <Badge className="ml-2" variant="outline">
                {ordenesEntregadas?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recibidas" className="space-y-4">
            {!ordenesRecibidas || ordenesRecibidas.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-sm text-muted-foreground text-center">
                    No hay órdenes recibidas
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {ordenesRecibidas.map(orden => (
                  <OrdenCard
                    key={orden.id}
                    orden={orden as any}
                    estado="recibida"
                    onTomarOrden={tomarOrdenMutation.mutate}
                    loading={tomarOrdenMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tomadas" className="space-y-4">
            {!ordenesTomadas || ordenesTomadas.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-sm text-muted-foreground text-center">
                    No hay órdenes en preparación
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {ordenesTomadas.map(orden => (
                  <OrdenCard
                    key={orden.id}
                    orden={orden as any}
                    estado="tomada"
                    onEntregarOrden={entregarOrdenMutation.mutate}
                    loading={entregarOrdenMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="entregadas" className="space-y-4">
            {!ordenesEntregadas || ordenesEntregadas.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-sm text-muted-foreground text-center">
                    No hay órdenes entregadas
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {ordenesEntregadas.map(orden => (
                  <OrdenCard
                    key={orden.id}
                    orden={orden as any}
                    estado="entregada"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
