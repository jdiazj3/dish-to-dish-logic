import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Receipt, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function CajeroDashboard() {
  const { user, signOut } = useAuth();
  const { data: roles, isLoading } = useUserRole(user?.id);

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
              <CardDescription className="text-3xl font-bold text-foreground">$0</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader>
              <Receipt className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Facturas Emitidas</CardTitle>
              <CardDescription className="text-3xl font-bold text-foreground">0</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Órdenes Listas para Facturar</CardTitle>
            <CardDescription>Órdenes entregadas pendientes de pago</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay órdenes pendientes de facturación
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
