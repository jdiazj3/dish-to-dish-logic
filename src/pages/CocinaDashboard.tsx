import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Clock, CheckCircle2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OrdenCard } from "@/components/OrdenCard";

export default function CocinaDashboard() {
  const { user, signOut } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const queryClient = useQueryClient();
  const [turnoActual, setTurnoActual] = useState<'manana' | 'tarde' | 'noche'>('manana');

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
        .select('*, mesas(numero, salones(nombre)), orden_productos(*, productos(nombre))')
        .eq('estado', 'recibida')
        .eq('turno', turnoActual)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: ordenesTomadas } = useQuery({
    queryKey: ['ordenes-tomadas', turnoActual],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*, mesas(numero, salones(nombre)), orden_productos(*, productos(nombre))')
        .eq('estado', 'tomada')
        .eq('turno', turnoActual)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: ordenesEntregadas } = useQuery({
    queryKey: ['ordenes-entregadas', turnoActual],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*, mesas(numero, salones(nombre)), orden_productos(*, productos(nombre))')
        .eq('estado', 'entregada')
        .eq('turno', turnoActual)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription
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
          queryClient.invalidateQueries({ queryKey: ['ordenes-recibidas'] });
          queryClient.invalidateQueries({ queryKey: ['ordenes-tomadas'] });
          queryClient.invalidateQueries({ queryKey: ['ordenes-entregadas'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
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
