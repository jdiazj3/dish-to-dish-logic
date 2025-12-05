import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GestionSalones } from "@/components/admin/GestionSalones";
import { GestionMesas } from "@/components/admin/GestionMesas";

export default function AdminMesasSalones() {
  const { user } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();

  // Esperar a que terminen de cargar los roles completamente
  if (isLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  const isAdmin = roles?.includes('admin_total') || roles?.includes('admin_sede');
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Mesas y Salones</h1>
              <p className="text-sm text-muted-foreground">Gestión de espacios del restaurante</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="mesas" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="mesas">Mesas</TabsTrigger>
            <TabsTrigger value="salones">Salones</TabsTrigger>
          </TabsList>

          <TabsContent value="mesas">
            <GestionMesas />
          </TabsContent>

          <TabsContent value="salones">
            <GestionSalones />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
