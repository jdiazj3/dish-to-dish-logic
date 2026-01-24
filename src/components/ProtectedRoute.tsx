import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sessionValid, setSessionValid] = useState(true);

  // Verificar sesión válida al montar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          // Limpiar localStorage de Supabase
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
          setSessionValid(false);
          navigate("/auth", { replace: true });
          return;
        }

        // Verificar que el token no esté expirado
        const expiresAt = session.expires_at;
        if (expiresAt && expiresAt * 1000 < Date.now()) {
          // Token expirado, limpiar
          await supabase.auth.signOut({ scope: 'local' });
          setSessionValid(false);
          navigate("/auth", { replace: true });
        }
      } catch (err) {
        console.error("Error verificando sesión:", err);
        setSessionValid(false);
        navigate("/auth", { replace: true });
      }
    };

    if (!loading) {
      checkSession();
    }
  }, [loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-lg text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user || !sessionValid) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
