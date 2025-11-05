import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Users, UtensilsCrossed, Settings, LayoutDashboard, DoorOpen } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { data: roles, isLoading } = useUserRole(user?.id);

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-card">
                <CardHeader className="pb-3">
                  <CardDescription>Ventas Hoy</CardDescription>
                  <CardTitle className="text-3xl">$0</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-gradient-card">
                <CardHeader className="pb-3">
                  <CardDescription>Órdenes Activas</CardDescription>
                  <CardTitle className="text-3xl">0</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-gradient-card">
                <CardHeader className="pb-3">
                  <CardDescription>Productos</CardDescription>
                  <CardTitle className="text-3xl">0</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-gradient-card">
                <CardHeader className="pb-3">
                  <CardDescription>Usuarios</CardDescription>
                  <CardTitle className="text-3xl">0</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
                <CardDescription>Top 5 productos del mes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No hay datos disponibles aún
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="productos">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Productos</CardTitle>
                <CardDescription>Administra el menú del restaurante</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Módulo en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>Administra el personal del restaurante</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Módulo en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mesas">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Mesas y Salones</CardTitle>
                <CardDescription>Configura la distribución del restaurante</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Módulo en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Restaurante</CardTitle>
                <CardDescription>Información general y contacto</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Módulo en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
