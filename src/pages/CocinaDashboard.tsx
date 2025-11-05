import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Clock, CheckCircle2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CocinaDashboard() {
  const { user, signOut } = useAuth();
  const { data: roles, isLoading } = useUserRole(user?.id);

  if (isLoading) {
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
          <div>
            <h1 className="text-2xl font-bold">Ancestrale - Cocina</h1>
            <p className="text-sm text-muted-foreground">Sistema de órdenes</p>
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
              <Badge className="ml-2" variant="destructive">0</Badge>
            </TabsTrigger>
            <TabsTrigger value="tomadas">
              <Package className="w-4 h-4 mr-2" />
              En Preparación
              <Badge className="ml-2" variant="secondary">0</Badge>
            </TabsTrigger>
            <TabsTrigger value="entregadas">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Entregadas
              <Badge className="ml-2" variant="outline">0</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recibidas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Órdenes Recibidas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay órdenes recibidas
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tomadas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Órdenes en Preparación</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay órdenes en preparación
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entregadas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Órdenes Entregadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay órdenes entregadas
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
