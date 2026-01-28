import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Receipt, DollarSign, TrendingUp, Coins, Calculator, Bell, BellOff, ClipboardList, Users, Monitor, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";
import { GraficoVentasPorHora } from "@/components/cajero/GraficoVentasPorHora";
import { ExportarVentas } from "@/components/cajero/ExportarVentas";
import { ReporteMetodosPago } from "@/components/cajero/ReporteMetodosPago";
import { useState } from "react";
import { formatCOP } from "@/utils/formatCurrency";

// Función para crear sonido de notificación usando Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Crear oscilador para el tono
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configurar el sonido - tono agradable tipo "ding"
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // La nota A5
    oscillator.type = 'sine';
    
    // Configurar el volumen con fade out
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // Reproducir
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Segundo tono más alto para hacer "ding-ding"
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.setValueAtTime(1100, audioContext.currentTime);
      osc2.type = 'sine';
      
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.5);
    }, 150);
    
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

export default function CajeroDashboard() {
  const { user, signOut } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastOrderIdRef = useRef<string | null>(null);

  const { data: estadisticas } = useQuery({
    queryKey: ['estadisticas-cajero-hoy'],
    queryFn: async () => {
      const hoy = new Date();
      const inicio = startOfDay(hoy).toISOString();
      const fin = endOfDay(hoy).toISOString();

      const { data, error } = await supabase
        .from('facturas')
        .select('total, propina')
        .gte('created_at', inicio)
        .lte('created_at', fin);

      if (error) throw error;

      const totalVentas = data?.reduce((sum, f) => sum + parseFloat(String(f.total)), 0) || 0;
      const totalPropinas = data?.reduce((sum, f) => sum + parseFloat(String(f.propina || 0)), 0) || 0;
      const totalFacturas = data?.length || 0;
      const ticketPromedio = totalFacturas > 0 ? totalVentas / totalFacturas : 0;

      return { totalVentas, totalFacturas, totalPropinas, ticketPromedio };
    },
  });

  // Query para contar órdenes pendientes por facturar (estado 'entregada')
  const { data: ordenesPendientes } = useQuery({
    queryKey: ['ordenes-pendientes-facturar'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('ordenes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'entregada');

      if (error) throw error;
      return count || 0;
    },
  });

  // Callback para manejar nueva orden entregada
  const handleNewDeliveredOrder = useCallback((payload: any) => {
    const newOrder = payload.new;
    
    // Evitar notificación duplicada
    if (lastOrderIdRef.current === newOrder.id) return;
    lastOrderIdRef.current = newOrder.id;
    
    // Solo notificar si el estado cambió a 'entregada'
    if (newOrder.estado === 'entregada') {
      if (soundEnabled) {
        playNotificationSound();
      }
      
        toast.success("Nueva orden lista para facturar", {
          description: `Orden #${newOrder.id.slice(0, 8)} - Total: ${formatCOP(newOrder.total || 0)}`,
          duration: 5000,
        });
    }
  }, [soundEnabled]);

  // Suscripción en tiempo real para facturas
  useEffect(() => {
    const channel = supabase
      .channel('facturas-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'facturas',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['estadisticas-cajero-hoy'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Suscripción en tiempo real para órdenes entregadas
  useEffect(() => {
    const ordenesChannel = supabase
      .channel('ordenes-entregadas-cajero')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ordenes',
        },
        (payload) => {
          const newOrder = payload.new as any;
          // Actualizar contador de órdenes pendientes
          queryClient.invalidateQueries({ queryKey: ['ordenes-pendientes-facturar'] });
          
          // Notificar solo si cambió a 'entregada'
          if (newOrder.estado === 'entregada') {
            handleNewDeliveredOrder(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordenesChannel);
    };
  }, [handleNewDeliveredOrder, queryClient]);

  // Esperar a que terminen de cargar los roles completamente
  if (isLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!roles?.includes('cajero')) {
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
          <div>
            <h1 className="text-2xl font-bold">Ancestrale - Caja</h1>
            <p className="text-sm text-muted-foreground">Sistema de facturación</p>
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
        <div className="flex justify-end mb-4">
          <ExportarVentas />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="bg-gradient-card">
            <CardHeader>
              <DollarSign className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Total Ventas Hoy</CardTitle>
              <CardDescription className="text-3xl font-bold text-foreground">
                {formatCOP(estadisticas?.totalVentas || 0)}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader>
              <Receipt className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Facturas Emitidas</CardTitle>
              <CardDescription className="text-3xl font-bold text-foreground">
                {estadisticas?.totalFacturas || 0}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader>
              <TrendingUp className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Ticket Promedio</CardTitle>
              <CardDescription className="text-3xl font-bold text-foreground">
                {formatCOP(estadisticas?.ticketPromedio || 0)}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader>
              <Coins className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Total Propinas</CardTitle>
              <CardDescription className="text-3xl font-bold text-foreground">
                {formatCOP(estadisticas?.totalPropinas || 0)}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <GraficoVentasPorHora />
          
          <div className="grid gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/cajero/facturacion')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Facturación</CardTitle>
                  {ordenesPendientes !== undefined && ordenesPendientes > 0 && (
                    <Badge variant="destructive" className="animate-pulse">
                      <ClipboardList className="w-3 h-3 mr-1" />
                      {ordenesPendientes} pendiente{ordenesPendientes > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <CardDescription>Gestiona órdenes y emite facturas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Receipt className="w-4 h-4 mr-2" />
                  Ir a Facturación
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/cajero/cierre')}>
              <CardHeader>
                <CardTitle>Cierre de Caja</CardTitle>
                <CardDescription>Registra el cierre diario</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  Ir a Cierre de Caja
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/cajero/clientes')}>
              <CardHeader>
                <CardTitle>Clientes Frecuentes</CardTitle>
                <CardDescription>Consulta y gestiona clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Ver Clientes
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-accent" onClick={() => navigate('/cajero/facturacion-domicilios')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-accent-foreground" />
                  Facturación por Local
                </CardTitle>
                <CardDescription>Factura consolidada de pedidos externos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">
                  <Receipt className="w-4 h-4 mr-2" />
                  Facturar Domicilios
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.open('/turnos', '_blank')}>
              <CardHeader>
                <CardTitle>Pantalla de Turnos</CardTitle>
                <CardDescription>Proyectar estado de órdenes</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Monitor className="w-4 h-4 mr-2" />
                  Abrir en Nueva Ventana
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-6">
          <ReporteMetodosPago />
        </div>
      </div>
    </div>
  );
}
