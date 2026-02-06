import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { ResumenFlujoCaja } from "@/components/cajero/flujocaja/ResumenFlujoCaja";
import { RegistroMovimiento } from "@/components/cajero/flujocaja/RegistroMovimiento";
import { HistorialMovimientos } from "@/components/cajero/flujocaja/HistorialMovimientos";
import { GastosRecurrentes } from "@/components/cajero/flujocaja/GastosRecurrentes";
import { GraficoFlujoSemanal } from "@/components/cajero/flujocaja/GraficoFlujoSemanal";

export default function CajeroFlujoCaja() {
  const { user } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();

  if (isLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!roles?.includes('cajero') && !roles?.includes('admin_total') && !roles?.includes('admin_sede')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cajero')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Flujo de Caja</h1>
            <p className="text-sm text-muted-foreground">Control de entradas, salidas y caja menor</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Resumen */}
        <ResumenFlujoCaja />

        {/* Contenido principal con tabs */}
        <Tabs defaultValue="registrar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="registrar">Registrar Movimiento</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
            <TabsTrigger value="recurrentes">Gastos Programados</TabsTrigger>
            <TabsTrigger value="analisis">Análisis</TabsTrigger>
          </TabsList>

          <TabsContent value="registrar" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <RegistroMovimiento />
              <GraficoFlujoSemanal />
            </div>
          </TabsContent>

          <TabsContent value="historial">
            <HistorialMovimientos />
          </TabsContent>

          <TabsContent value="recurrentes">
            <GastosRecurrentes />
          </TabsContent>

          <TabsContent value="analisis">
            <div className="grid gap-6">
              <GraficoFlujoSemanal />
              {/* Aquí se pueden agregar más gráficos de análisis */}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
