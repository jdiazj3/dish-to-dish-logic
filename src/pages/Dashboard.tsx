import { useAuth } from "@/hooks/useAuth";
import { useUserRole, useProfile } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, ChefHat, User } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { data: roles, isLoading: rolesLoading } = useUserRole(user?.id);
  const { data: profile } = useProfile(user?.id);

  console.log('Dashboard render:', { 
    userId: user?.id, 
    rolesLoading, 
    roles,
    hasRoles: roles?.length 
  });

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
      return;
    }
    toast.success("Sesión cerrada exitosamente");
  };

  if (rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-lg text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  // Si no tiene roles asignados, mostrar mensaje
  if (!roles || roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-glow">
                <ChefHat className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-center">Bienvenido a Ancestrale</CardTitle>
            <CardDescription className="text-center">
              Tu cuenta ha sido creada exitosamente. Un administrador debe asignarte un rol para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Usuario:</strong> {profile?.nombre} {profile?.apellido}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Email:</strong> {user?.email}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/perfil">
                    <User className="w-4 h-4 mr-2" />
                    Ver Perfil
                  </Link>
                </Button>
                <Button onClick={handleSignOut} variant="outline" className="flex-1">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirigir según el rol principal
  const primaryRole = roles[0];
  
  const roleRoutes = {
    admin_total: '/admin',
    admin_sede: '/admin',
    mesero: '/mesero',
    cocina: '/cocina',
    cajero: '/cajero',
  };

  return <Navigate to={roleRoutes[primaryRole]} replace />;
}
