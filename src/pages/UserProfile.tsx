import { useAuth } from "@/hooks/useAuth";
import { useUserRole, useProfile } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Mail, Phone, MapPin, Building2, Clock, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ROLE_LABELS = {
  admin_total: "Administrador Total",
  admin_sede: "Administrador de Sede",
  mesero: "Mesero",
  cocina: "Cocina",
  cajero: "Cajero"
};

const TURNO_LABELS = {
  manana: "Mañana",
  tarde: "Tarde",
  noche: "Noche"
};

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: roles, isLoading: rolesLoading } = useUserRole(user?.id);
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
      return;
    }
    toast.success("Sesión cerrada exitosamente");
    navigate("/auth");
  };

  const isLoading = rolesLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-lg text-muted-foreground">Cargando perfil...</div>
      </div>
    );
  }

  const getInitials = () => {
    if (profile?.nombre && profile?.apellido) {
      return `${profile.nombre.charAt(0)}${profile.apellido.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.foto_url || ""} alt={profile?.nombre || ""} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left flex-1">
                  <CardTitle className="text-3xl">
                    {profile?.nombre} {profile?.apellido}
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    {user?.email}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Roles Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Roles Asignados</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {roles && roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <Badge key={role} variant="default" className="text-sm py-1 px-3">
                      {ROLE_LABELS[role] || role}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay roles asignados</p>
              )}
            </CardContent>
          </Card>

          {/* Contact & Work Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Información Personal y Laboral</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Correo Electrónico</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.correo || user?.email || "No especificado"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Phone */}
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Teléfono</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.telefono || "No especificado"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Dirección</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.direccion || "No especificada"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Sede */}
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Sede Asignada</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.sedes?.nombre || "No asignada"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Turno */}
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Turno de Trabajo</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.turno ? TURNO_LABELS[profile.turno] || profile.turno : "No asignado"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
