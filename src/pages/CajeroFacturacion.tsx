import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FacturacionOrdenes } from "@/components/cajero/FacturacionOrdenes";
import { ConsultaFacturas } from "@/components/cajero/ConsultaFacturas";

export default function CajeroFacturacion() {
  const { user } = useAuth();
  const { data: roles, isLoading } = useUserRole(user?.id);
  const navigate = useNavigate();

  // Esperar a que tanto el usuario como los roles estén cargados
  if (isLoading || !user || !roles) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  const isCajeroOrAdmin = roles.includes('cajero') || roles.includes('admin_total') || roles.includes('admin_sede');
  
  if (!isCajeroOrAdmin) {
    return <Navigate to="/" replace />;
  }

  console.log('CajeroFacturacion - Rendering main content');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/cajero')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Facturación</h1>
              <p className="text-sm text-muted-foreground">Gestión de facturas del restaurante</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="pendientes" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pendientes">Órdenes Pendientes</TabsTrigger>
            <TabsTrigger value="consulta">Consultar Facturas</TabsTrigger>
          </TabsList>

          <TabsContent value="pendientes">
            <FacturacionOrdenes />
          </TabsContent>

          <TabsContent value="consulta">
            <ConsultaFacturas />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
