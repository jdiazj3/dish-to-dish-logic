import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Verificar sesión válida al montar y periodicamente
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        // Sesión inválida, redirigir a login
        navigate("/auth", { replace: true });
      }
    };

    // Verificar inmediatamente
    if (!loading && user) {
      checkSession();
    }

    // Verificar cada 30 segundos
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-lg text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
