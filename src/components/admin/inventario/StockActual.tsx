import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Boxes, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

interface StockItem {
  id: string;
  producto_id: string;
  cantidad_actual: number;
  cantidad_minima: number;
  ultima_actualizacion: string;
  productos: { nombre: string; precio: number } | null;
}

export const StockActual = () => {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [editandoMinimo, setEditandoMinimo] = useState<{ id: string; valor: string } | null>(null);

  const { data: stock, isLoading } = useQuery({
    queryKey: ["inventario-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario_stock")
        .select(`
          *,
          productos:producto_id(nombre, precio)
        `)
        .order("cantidad_actual", { ascending: true });
      if (error) throw error;
      return data as StockItem[];
    },
  });

  const updateMinimoMutation = useMutation({
    mutationFn: async ({ id, cantidad_minima }: { id: string; cantidad_minima: number }) => {
      const { error } = await supabase
        .from("inventario_stock")
        .update({ cantidad_minima })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario-stock"] });
      toast.success("Cantidad mínima actualizada");
      setEditandoMinimo(null);
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const stockFiltrado = stock?.filter(item =>
    item.productos?.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const stockBajo = stock?.filter(item => item.cantidad_actual <= item.cantidad_minima) || [];

  const handleGuardarMinimo = (id: string) => {
    if (!editandoMinimo) return;
    const valor = parseFloat(editandoMinimo.valor);
    if (isNaN(valor) || valor < 0) {
      toast.error("Valor inválido");
      return;
    }
    updateMinimoMutation.mutate({ id, cantidad_minima: valor });
  };

  return (
    <div className="space-y-6">
      {stockBajo.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Stock Bajo ({stockBajo.length} productos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stockBajo.map(item => (
                <Badge key={item.id} variant="destructive" className="text-sm">
                  {item.productos?.nombre}: {item.cantidad_actual} unid.
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="w-5 h-5" />
                Stock Actual
              </CardTitle>
              <CardDescription>Inventario actual de productos en bodega/cocina</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 w-60"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando stock...</p>
          ) : !stockFiltrado?.length ? (
            <p className="text-muted-foreground text-center py-8">
              {busqueda ? "No se encontraron productos" : "No hay stock registrado. Registra entradas de inventario."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Precio Venta</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                  <TableHead className="text-right">Stock Mínimo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Actualización</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockFiltrado.map((item) => {
                  const esBajo = item.cantidad_actual <= item.cantidad_minima;
                  return (
                    <TableRow key={item.id} className={esBajo ? "bg-destructive/5" : ""}>
                      <TableCell className="font-medium">
                        {item.productos?.nombre || "Producto eliminado"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.productos?.precio.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.cantidad_actual}
                      </TableCell>
                      <TableCell className="text-right">
                        {editandoMinimo?.id === item.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Input
                              type="number"
                              min="0"
                              value={editandoMinimo.valor}
                              onChange={(e) => setEditandoMinimo({ id: item.id, valor: e.target.value })}
                              className="w-20 h-8"
                            />
                            <Button size="sm" onClick={() => handleGuardarMinimo(item.id)}>
                              OK
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditandoMinimo(null)}>
                              X
                            </Button>
                          </div>
                        ) : (
                          <span
                            className="cursor-pointer hover:underline"
                            onClick={() => setEditandoMinimo({ id: item.id, valor: item.cantidad_minima.toString() })}
                          >
                            {item.cantidad_minima}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={esBajo ? "destructive" : "secondary"}>
                          {esBajo ? "Stock Bajo" : "Normal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(item.ultima_actualizacion), "dd MMM yyyy HH:mm", { locale: es })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
