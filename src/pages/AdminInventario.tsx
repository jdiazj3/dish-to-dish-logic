import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Truck, Boxes } from "lucide-react";
import { GestionProveedores } from "@/components/admin/inventario/GestionProveedores";
import { RegistroEntradas } from "@/components/admin/inventario/RegistroEntradas";
import { StockActual } from "@/components/admin/inventario/StockActual";

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
              <p className="text-muted-foreground">Administra entradas, proveedores y stock</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="entradas" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="entradas" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Entradas
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Boxes className="w-4 h-4" />
              Stock
            </TabsTrigger>
            <TabsTrigger value="proveedores" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Proveedores
            </TabsTrigger>
          </TabsList>

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
