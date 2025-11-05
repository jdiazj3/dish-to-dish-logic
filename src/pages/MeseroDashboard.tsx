import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export default function MeseroDashboard() {
  const { user, signOut } = useAuth();
  const { data: roles, isLoading } = useUserRole(user?.id);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

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
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <Plus className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Nueva Orden</CardTitle>
              <CardDescription>Crear un nuevo pedido para una mesa</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-primary">
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
              <Button variant="outline" className="w-full">
                Ver Órdenes
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Órdenes Activas</CardTitle>
            <CardDescription>Órdenes en proceso</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay órdenes activas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
