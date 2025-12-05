import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, Package, Tag } from "lucide-react";
import { toast } from "sonner";
import { GestionProductos } from "@/components/admin/GestionProductos";
import { GestionCategorias } from "@/components/admin/GestionCategorias";
import { useNavigate } from "react-router-dom";

export default function AdminProductos() {
  const { user, signOut } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();

  // Esperar a que terminen de cargar los roles completamente
  if (isLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  const isAdmin = roles?.includes('admin_total') || roles?.includes('admin_sede');
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gestión de Productos</h1>
              <p className="text-sm text-muted-foreground">Administra menú y categorías</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="productos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="productos">
              <Package className="w-4 h-4 mr-2" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="categorias">
              <Tag className="w-4 h-4 mr-2" />
              Categorías
            </TabsTrigger>
          </TabsList>

          <TabsContent value="productos">
            <Card>
              <CardHeader>
                <CardTitle>Productos del Menú</CardTitle>
                <CardDescription>Gestiona productos con fotos, precios y disponibilidad</CardDescription>
              </CardHeader>
              <CardContent>
                <GestionProductos />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categorias">
            <Card>
              <CardHeader>
                <CardTitle>Categorías</CardTitle>
                <CardDescription>Organiza tus productos en categorías</CardDescription>
              </CardHeader>
              <CardContent>
                <GestionCategorias />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
