import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Truck, Boxes, Tags, UtensilsCrossed, ShoppingCart } from "lucide-react";
import { GestionProveedores } from "@/components/admin/inventario/GestionProveedores";
import { RegistroEntradas } from "@/components/admin/inventario/RegistroEntradas";
import { StockActual } from "@/components/admin/inventario/StockActual";
import { GestionTiposInsumos } from "@/components/admin/inventario/GestionTiposInsumos";
import { GestionInsumos } from "@/components/admin/inventario/GestionInsumos";
import { EntradasInsumos } from "@/components/admin/inventario/EntradasInsumos";

const AdminInventario = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gestión de Inventario</h1>
              <p className="text-muted-foreground">Administra productos, insumos y proveedores</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="insumos" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-6">
            <TabsTrigger value="insumos" className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              <span className="hidden sm:inline">Insumos</span>
            </TabsTrigger>
            <TabsTrigger value="entradas-insumos" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Compras</span>
            </TabsTrigger>
            <TabsTrigger value="tipos" className="flex items-center gap-2">
              <Tags className="w-4 h-4" />
              <span className="hidden sm:inline">Tipos</span>
            </TabsTrigger>
            <TabsTrigger value="entradas" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Entradas</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Boxes className="w-4 h-4" />
              <span className="hidden sm:inline">Stock</span>
            </TabsTrigger>
            <TabsTrigger value="proveedores" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">Proveedores</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insumos">
            <GestionInsumos />
          </TabsContent>

          <TabsContent value="entradas-insumos">
            <EntradasInsumos />
          </TabsContent>

          <TabsContent value="tipos">
            <GestionTiposInsumos />
          </TabsContent>

          <TabsContent value="entradas">
            <RegistroEntradas />
          </TabsContent>

          <TabsContent value="stock">
            <StockActual />
          </TabsContent>

          <TabsContent value="proveedores">
            <GestionProveedores />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminInventario;
