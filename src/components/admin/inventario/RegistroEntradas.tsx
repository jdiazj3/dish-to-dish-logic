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
import { Plus, Package, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Producto {
  id: string;
  nombre: string;
}

interface Proveedor {
  id: string;
  nombre: string;
}

interface EntradaInventario {
  id: string;
  producto_id: string;
  proveedor_id: string | null;
  cantidad: number;
  precio_compra: number;
  fecha_ingreso: string;
  lote: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  created_at: string;
  productos: { nombre: string } | null;
  proveedores: { nombre: string } | null;
}

export const RegistroEntradas = () => {
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
    queryKey: ["productos-inventario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre")
        .order("nombre");
      if (error) throw error;
      return data as Producto[];
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
    queryKey: ["inventario-entradas", filtroFecha],
    queryFn: async () => {
      let query = supabase
        .from("inventario_entradas")
        .select(`
          *,
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
      return data as EntradaInventario[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("inventario_entradas").insert([{
        producto_id: data.producto_id,
        proveedor_id: data.proveedor_id || null,
        cantidad: parseFloat(data.cantidad),
        precio_compra: parseFloat(data.precio_compra),
        fecha_ingreso: data.fecha_ingreso,
        lote: data.lote || null,
        fecha_vencimiento: data.fecha_vencimiento || null,
        notas: data.notas || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario-entradas"] });
      queryClient.invalidateQueries({ queryKey: ["inventario-stock"] });
      toast.success("Entrada registrada exitosamente");
      resetForm();
    },
    onError: () => toast.error("Error al registrar entrada"),
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

  const calcularTotal = () => {
    const cantidad = parseFloat(formData.cantidad) || 0;
    const precio = parseFloat(formData.precio_compra) || 0;
    return (cantidad * precio).toLocaleString("es-CO", { style: "currency", currency: "COP" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Entradas de Inventario
            </CardTitle>
            <CardDescription>Registra las compras e ingresos a bodega/cocina</CardDescription>
          </div>
          <div className="flex items-center gap-4">
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Entrada
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registrar Entrada de Inventario</DialogTitle>
                  <DialogDescription>
                    Ingresa los datos de la compra o ingreso a bodega
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Producto *</Label>
                    <Select
                      value={formData.producto_id}
                      onValueChange={(v) => setFormData({ ...formData, producto_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <SelectContent>
                        {proveedores?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cantidad *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.cantidad}
                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Precio Compra (unit) *</Label>
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
                  {formData.cantidad && formData.precio_compra && (
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <span className="text-sm text-muted-foreground">Total: </span>
                      <span className="font-semibold">{calcularTotal()}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha Ingreso</Label>
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
                    Registrar Entrada
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Cargando entradas...</p>
        ) : !entradas?.length ? (
          <p className="text-muted-foreground text-center py-8">No hay entradas registradas</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
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
                  <TableCell className="text-right">
                    {entrada.precio_compra.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {(entrada.cantidad * entrada.precio_compra).toLocaleString("es-CO", { style: "currency", currency: "COP" })}
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
