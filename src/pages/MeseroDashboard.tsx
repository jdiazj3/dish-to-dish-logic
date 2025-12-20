import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { formatCOP } from "@/utils/formatCurrency";

export default function MeseroDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: roles, isLoading: rolesLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();

  const { data: ordenesActivas } = useQuery({
    queryKey: ['ordenes-mesero', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*, numero_orden, mesas(numero, salones(nombre)), orden_productos(cantidad)')
        .eq('mesero_id', user?.id)
        .in('estado', ['recibida', 'tomada'])
        .order('numero_orden', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Esperar a que terminen de cargar los roles completamente
  if (authLoading || rolesLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  // Si no hay usuario, redirigir a auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Verificar rol de mesero
  if (!roles?.includes('mesero')) {
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
            <h1 className="text-2xl font-bold">Ancestrale - Mesero</h1>
            <p className="text-sm text-muted-foreground">Sistema de órdenes</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-primary"
            onClick={() => navigate('/orden/nueva')}
          >
            <CardHeader>
              <Plus className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Nueva Orden</CardTitle>
              <CardDescription>Crear un nuevo pedido para una mesa</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-primary pointer-events-none">
                Crear Orden
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <ClipboardList className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Mis Órdenes</CardTitle>
              <CardDescription>Ver órdenes activas y pendientes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full pointer-events-none">
                Ver Órdenes
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Órdenes Activas</CardTitle>
            <CardDescription>Haz clic en una orden para ver detalles o editarla</CardDescription>
          </CardHeader>
          <CardContent>
            {!ordenesActivas || ordenesActivas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay órdenes activas</p>
            ) : (
              <div className="space-y-3">
                {ordenesActivas.map(orden => (
                  <div 
                    key={orden.id} 
                    className="p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => navigate(`/orden/${orden.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        {orden.numero_orden && (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                            {orden.numero_orden}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">Mesa {orden.mesas?.numero}</p>
                          <p className="text-sm text-muted-foreground">{orden.mesas?.salones?.nombre}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={orden.estado === 'recibida' ? 'destructive' : 'secondary'}>
                          {orden.estado === 'recibida' ? 'En espera' : 'En preparación'}
                        </Badge>
                        {orden.estado === 'recibida' && (
                          <Badge variant="outline" className="text-xs">Editable</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm">
                      {orden.orden_productos?.reduce((sum: number, p: any) => sum + p.cantidad, 0)} productos • {formatCOP(orden.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
