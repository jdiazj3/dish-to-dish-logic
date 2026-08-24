import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { ArrowLeft, QrCode } from "lucide-react";
import { VenderValera } from "@/components/cajero/valeras/VenderValera";
import { ListaValeras } from "@/components/cajero/valeras/ListaValeras";

export default function CajeroValeras() {
  const { user } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();

  if (isLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando…</div>;
  }

  const permitido = roles?.some((r) => ["cajero", "admin_total", "admin_sede"].includes(r));
  if (!permitido) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cajero")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Valeras</h1>
              <p className="text-sm text-muted-foreground">Almuerzos prepagados</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/cajero/cobrar-valera")}>
            <QrCode className="w-4 h-4 mr-2" />
            Cobrar con valera
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <VenderValera />
          <div className="lg:col-span-1">
            <ListaValeras />
          </div>
        </div>
      </main>
    </div>
  );
}
