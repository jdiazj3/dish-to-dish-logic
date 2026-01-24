import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export default function Logout() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error("Error al cerrar sesión:", error);
        toast.error("Error al cerrar sesión");
        return;
      }
      toast.success("Sesión cerrada exitosamente");
      // Forzar redirección completa para limpiar estado
      window.location.href = "/auth";
    } catch (err) {
      console.error("Error inesperado:", err);
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Cerrar Sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Presiona el botón para cerrar tu sesión actual
          </p>
          <Button onClick={handleSignOut} className="w-full" size="lg">
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
