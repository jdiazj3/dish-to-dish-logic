import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, ClipboardList, MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatCOP } from "@/utils/formatCurrency";

export default function MeseroExternoDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { data: roles, isLoading: rolesLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();

  const { data: ordenesActivas } = useQuery({
    queryKey: ['ordenes-mesero-externo', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*, numero_orden, mesas(numero, salones(nombre)), orden_productos(cantidad)')
        .eq('mesero_id', user?.id)
        .eq('es_domicilio', true)
        .in('estado', ['recibida', 'tomada'])
        .order('numero_orden', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (authLoading || rolesLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!roles?.includes('mesero_externo')) {
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Ancestrale - Domicilios
            </h1>
            <p className="text-sm text-muted-foreground">Pedidos externos a oficinas y locales</p>
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
            onClick={() => navigate('/orden/domicilio')}
          >
            <CardHeader>
              <Plus className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Nuevo Pedido Externo</CardTitle>
              <CardDescription>Crear pedido para oficina, local u otra ubicación</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-primary pointer-events-none">
                Crear Pedido
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <ClipboardList className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Mis Pedidos</CardTitle>
              <CardDescription>Ver pedidos activos y pendientes de entrega</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full pointer-events-none">
                Ver Pedidos
              </Button>
            </CardContent>
          </Card>

        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pedidos Activos</CardTitle>
            <CardDescription>Haz clic en un pedido para ver detalles</CardDescription>
          </CardHeader>
          <CardContent>
            {!ordenesActivas || ordenesActivas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay pedidos externos activos</p>
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
                          <p className="font-semibold flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Ubicación {orden.mesas?.numero}
                          </p>
                          <p className="text-sm text-muted-foreground">{orden.mesas?.salones?.nombre}</p>
                          {orden.nombre_cliente && (
                            <p className="text-sm text-primary">{orden.nombre_cliente}</p>
                          )}
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
