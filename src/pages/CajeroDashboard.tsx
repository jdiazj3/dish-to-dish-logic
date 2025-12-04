import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Receipt, DollarSign, TrendingUp, Coins, Calculator } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";
import { GraficoVentasPorHora } from "@/components/cajero/GraficoVentasPorHora";
import { ExportarVentas } from "@/components/cajero/ExportarVentas";

export default function CajeroDashboard() {
  const { user, signOut } = useAuth();
  const { data: roles, isLoading } = useUserRole(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Suscripción en tiempo real
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

  if (isLoading) {
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
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
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
                ${estadisticas?.totalVentas.toLocaleString('es-CO') || '0'}
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
                ${estadisticas?.ticketPromedio.toLocaleString('es-CO', { maximumFractionDigits: 0 }) || '0'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader>
              <Coins className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Total Propinas</CardTitle>
              <CardDescription className="text-3xl font-bold text-foreground">
                ${estadisticas?.totalPropinas.toLocaleString('es-CO') || '0'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <GraficoVentasPorHora />
          
          <div className="grid gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/cajero/facturacion')}>
              <CardHeader>
                <CardTitle>Facturación</CardTitle>
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
          </div>
        </div>
      </div>
    </div>
  );
}
