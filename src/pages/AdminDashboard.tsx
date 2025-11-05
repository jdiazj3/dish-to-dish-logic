import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Users, UtensilsCrossed, Settings, LayoutDashboard, DoorOpen, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { GestionProductos } from "@/components/admin/GestionProductos";
import { GestionCategorias } from "@/components/admin/GestionCategorias";
import { GestionUsuarios } from "@/components/admin/GestionUsuarios";
import { EstadisticasVentas } from "@/components/admin/EstadisticasVentas";
import { GraficoVentasPorDia } from "@/components/admin/GraficoVentasPorDia";
import { ProductosMasVendidos } from "@/components/admin/ProductosMasVendidos";
import { VentasPorCategoria } from "@/components/admin/VentasPorCategoria";
import { OrdenesEnTiempoReal } from "@/components/admin/OrdenesEnTiempoReal";

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { data: roles, isLoading } = useUserRole(user?.id);
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  const isAdmin = roles?.includes('admin_total') || roles?.includes('admin_sede');
  if (!isAdmin) {
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Ancestrale</h1>
              <p className="text-sm text-muted-foreground">Panel de Administración</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="reportes">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reportes
            </TabsTrigger>
            <TabsTrigger value="productos">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="usuarios">
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="mesas">
              <DoorOpen className="w-4 h-4 mr-2" />
              Mesas
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <EstadisticasVentas />
            
            <div className="grid gap-4 md:grid-cols-2">
              <GraficoVentasPorDia />
              <ProductosMasVendidos />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <VentasPorCategoria />
              <OrdenesEnTiempoReal />
            </div>
          </TabsContent>

          <TabsContent value="reportes">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/reportes')}>
              <CardHeader>
                <CardTitle>Reportes y Analytics</CardTitle>
                <CardDescription>Análisis avanzado de ventas y desempeño</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Ver Reportes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="productos">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/productos')}>
              <CardHeader>
                <CardTitle>Gestión de Productos</CardTitle>
                <CardDescription>Administra el menú del restaurante</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <UtensilsCrossed className="w-4 h-4 mr-2" />
                  Ir a Productos
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios">
            <GestionUsuarios />
          </TabsContent>

          <TabsContent value="mesas">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/mesas-salones')}>
              <CardHeader>
                <CardTitle>Gestión de Mesas y Salones</CardTitle>
                <CardDescription>Configura la distribución del restaurante</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <DoorOpen className="w-4 h-4 mr-2" />
                  Ir a Mesas y Salones
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/sedes')}>
              <CardHeader>
                <CardTitle>Gestión de Sedes</CardTitle>
                <CardDescription>Configura las sedes del restaurante</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <DoorOpen className="w-4 h-4 mr-2" />
                  Ir a Sedes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
