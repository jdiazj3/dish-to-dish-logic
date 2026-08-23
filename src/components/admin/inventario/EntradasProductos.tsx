import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShoppingBag, Plus, Calendar, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCOP } from "@/utils/formatCurrency";

interface ProductoReventa {
  id: string;
  nombre: string;
}

interface Proveedor {
  id: string;
  nombre: string;
}

interface EntradaProducto {
  id: string;
  cantidad: number;
  precio_compra: number;
  fecha_ingreso: string;
  lote: string | null;
  fecha_vencimiento: string | null;
  productos: { nombre: string } | null;
  proveedores: { nombre: string } | null;
}

export const EntradasProductos = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [formData, setFormData] = useState({
    producto_id: "",
    proveedor_id: "",
    cantidad: "",
    precio_compra: "",
    fecha_ingreso: format(new Date(), "yyyy-MM-dd"),
    lote: "",
    fecha_vencimiento: "",
    notas: "",
  });

  const { data: productos } = useQuery({
    queryKey: ["productos-reventa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre")
        .eq("controla_inventario", true)
        .order("nombre");
      if (error) throw error;
      return data as ProductoReventa[];
    },
  });

  const { data: proveedores } = useQuery({
    queryKey: ["proveedores-activos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proveedores")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return data as Proveedor[];
    },
  });

  const { data: entradas, isLoading } = useQuery({
    queryKey: ["entradas-productos", filtroFecha],
    queryFn: async () => {
      let query = supabase
        .from("inventario_entradas")
        .select(`
          id, cantidad, precio_compra, fecha_ingreso, lote, fecha_vencimiento,
          productos:producto_id(nombre),
          proveedores:proveedor_id(nombre)
        `)
        .order("fecha_ingreso", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (filtroFecha) {
        query = query.eq("fecha_ingreso", filtroFecha);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as EntradaProducto[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("inventario_entradas").insert([{
        producto_id: data.producto_id,
        proveedor_id: data.proveedor_id || null,
        cantidad: parseFloat(data.cantidad),
        precio_compra: parseFloat(data.precio_compra),
        fecha_ingreso: data.fecha_ingreso,
        lote: data.lote || null,
        fecha_vencimiento: data.fecha_vencimiento || null,
        notas: data.notas || null,
        registrado_por: userData.user?.id ?? null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entradas-productos"] });
      queryClient.invalidateQueries({ queryKey: ["productos-stock"] });
      toast.success("Compra registrada. Existencias actualizadas automáticamente.");
      resetForm();
    },
    onError: () => toast.error("Error al registrar la compra"),
  });

  const resetForm = () => {
    setFormData({
      producto_id: "",
      proveedor_id: "",
      cantidad: "",
      precio_compra: "",
      fecha_ingreso: format(new Date(), "yyyy-MM-dd"),
      lote: "",
      fecha_vencimiento: "",
      notas: "",
    });
    setDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.producto_id || !formData.cantidad || !formData.precio_compra) {
      toast.error("Producto, cantidad y precio son requeridos");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Compras de Productos de Reventa
            </CardTitle>
            <CardDescription>
              Cervezas, gaseosas, helados y demás productos que se venden tal como se compran
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Compra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Compra de Producto</DialogTitle>
                <DialogDescription>
                  Las existencias suben automáticamente y bajan al facturar la venta
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    Solo aparecen productos del menú marcados con "Controla inventario".
                    Actívalo en Gestión de Productos para bebidas, helados y similares.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Producto *</Label>
                  <Select
                    value={formData.producto_id}
                    onValueChange={(v) => setFormData({ ...formData, producto_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {productos?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {productos?.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No hay productos con control de inventario todavía.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Select
                    value={formData.proveedor_id}
                    onValueChange={(v) => setFormData({ ...formData, proveedor_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proveedor (opcional)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {proveedores?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad (unidades) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.cantidad}
                      onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio Total de Compra *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={formData.precio_compra}
                      onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                {formData.cantidad && formData.precio_compra && parseFloat(formData.cantidad) > 0 && (
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <span className="text-sm text-muted-foreground">Costo por unidad: </span>
                    <span className="font-semibold">
                      {formatCOP(parseFloat(formData.precio_compra) / parseFloat(formData.cantidad))}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de Ingreso</Label>
                    <Input
                      type="date"
                      value={formData.fecha_ingreso}
                      onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lote</Label>
                    <Input
                      value={formData.lote}
                      onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                      placeholder="Número de lote"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fecha Vencimiento</Label>
                  <Input
                    type="date"
                    value={formData.fecha_vencimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Notas adicionales"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  Registrar Compra
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="w-40"
          />
          {filtroFecha && (
            <Button variant="ghost" size="sm" onClick={() => setFiltroFecha("")}>
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Cargando compras...</p>
        ) : !entradas?.length ? (
          <p className="text-muted-foreground text-center py-8">No hay compras de productos registradas</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Total</TableHead>
                <TableHead className="text-right">Costo Unit.</TableHead>
                <TableHead>Lote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entradas.map((entrada) => (
                <TableRow key={entrada.id}>
                  <TableCell>
                    {format(new Date(entrada.fecha_ingreso), "dd MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {entrada.productos?.nombre || "Producto eliminado"}
                  </TableCell>
                  <TableCell>{entrada.proveedores?.nombre || "-"}</TableCell>
                  <TableCell className="text-right">{entrada.cantidad}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCOP(entrada.precio_compra)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCOP(entrada.cantidad > 0 ? entrada.precio_compra / entrada.cantidad : 0)}
                  </TableCell>
                  <TableCell>{entrada.lote || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
