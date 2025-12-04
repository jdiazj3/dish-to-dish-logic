import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CierreCaja } from "@/components/cajero/CierreCaja";

export default function CajeroCierre() {
  const { user } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();

  // Esperar a que terminen de cargar los roles completamente
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
            <h1 className="text-2xl font-bold">Cierre de Caja</h1>
            <p className="text-sm text-muted-foreground">Registro de cierre diario</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <CierreCaja />
      </div>
    </div>
  );
}
