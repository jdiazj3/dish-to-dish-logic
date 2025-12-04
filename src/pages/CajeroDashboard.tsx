import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Receipt, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";
import { GraficoVentasPorHora } from "@/components/cajero/GraficoVentasPorHora";

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
        .select('total')
        .gte('created_at', inicio)
        .lte('created_at', fin);

      if (error) throw error;

      const totalVentas = data?.reduce((sum, f) => sum + parseFloat(String(f.total)), 0) || 0;
      const totalFacturas = data?.length || 0;

      return { totalVentas, totalFacturas };
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
        <div className="grid gap-6 md:grid-cols-2 mb-6">
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
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <GraficoVentasPorHora />
          
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
        </div>
      </div>
    </div>
  );
}
