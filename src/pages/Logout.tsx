import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Logout() {
  const queryClient = useQueryClient();

  const handleSignOut = () => {
    // Limpiar caché de React Query
    queryClient.clear();
    
    // Limpiar todo el almacenamiento local
    localStorage.clear();
    sessionStorage.clear();
    
    // Signout local sin esperar respuesta del servidor
    supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    
    // Redirigir inmediatamente
    window.location.href = "/auth";
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
