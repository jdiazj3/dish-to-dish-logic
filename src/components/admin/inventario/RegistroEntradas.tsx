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
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Calendar, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Insumo {
  id: string;
  nombre: string;
  unidad_medida: string;
}

interface Proveedor {
  id: string;
  nombre: string;
}

interface EntradaInsumo {
  id: string;
  insumo_id: string;
  proveedor_id: string | null;
  cantidad: number;
  peso: number | null;
  precio_compra: number;
  fecha_compra: string;
  lote: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  created_at: string;
  insumos_restaurante: { nombre: string; unidad_medida: string } | null;
  proveedores: { nombre: string } | null;
}

export const RegistroEntradas = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [formData, setFormData] = useState({
    insumo_id: "",
    proveedor_id: "",
    cantidad: "",
    peso: "",
    precio_compra: "",
    fecha_compra: format(new Date(), "yyyy-MM-dd"),
    lote: "",
    fecha_vencimiento: "",
    notas: "",
  });

  const { data: insumos } = useQuery({
    queryKey: ["insumos-activos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insumos_restaurante")
        .select("id, nombre, unidad_medida")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return data as Insumo[];
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
    queryKey: ["entradas-insumos", filtroFecha],
    queryFn: async () => {
      let query = supabase
        .from("inventario_entradas_insumos")
        .select(`
          *,
          insumos_restaurante:insumo_id(nombre, unidad_medida),
          proveedores:proveedor_id(nombre)
        `)
        .order("fecha_compra", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (filtroFecha) {
        query = query.eq("fecha_compra", filtroFecha);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EntradaInsumo[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("inventario_entradas_insumos").insert([{
        insumo_id: data.insumo_id,
        proveedor_id: data.proveedor_id || null,
        cantidad: parseFloat(data.cantidad),
        peso: data.peso ? parseFloat(data.peso) : null,
        precio_compra: parseFloat(data.precio_compra),
        fecha_compra: data.fecha_compra,
        lote: data.lote || null,
        fecha_vencimiento: data.fecha_vencimiento || null,
        notas: data.notas || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entradas-insumos"] });
      queryClient.invalidateQueries({ queryKey: ["insumos-stock"] });
      toast.success("Entrada de insumo registrada. Stock actualizado automáticamente.");
      resetForm();
    },
    onError: () => toast.error("Error al registrar entrada"),
  });

  const resetForm = () => {
    setFormData({
      insumo_id: "",
      proveedor_id: "",
      cantidad: "",
      peso: "",
      precio_compra: "",
      fecha_compra: format(new Date(), "yyyy-MM-dd"),
      lote: "",
      fecha_vencimiento: "",
      notas: "",
    });
    setDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.insumo_id || !formData.cantidad || !formData.precio_compra) {
      toast.error("Insumo, cantidad y precio son requeridos");
      return;
    }
    createMutation.mutate(formData);
  };

  const calcularTotal = () => {
    const cantidad = parseFloat(formData.cantidad) || 0;
    const precio = parseFloat(formData.precio_compra) || 0;
    return (cantidad * precio).toLocaleString("es-CO", { style: "currency", currency: "COP" });
  };

  const getUnidadLabel = (unidad: string) => {
    const unidades: Record<string, string> = {
      kg: "kg",
      g: "g",
      lt: "lt",
      ml: "ml",
      unidad: "unid",
    };
    return unidades[unidad] || unidad;
  };

  const insumoSeleccionado = insumos?.find(i => i.id === formData.insumo_id);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Registro de Compras de Insumos
            </CardTitle>
            <CardDescription>
              Registra las compras de insumos y materias primas (no productos de venta)
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
                <DialogTitle>Registrar Compra de Insumo</DialogTitle>
                <DialogDescription>
                  El stock se actualizará automáticamente al registrar la compra
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    Solo registra insumos/materias primas aquí. Los productos del menú se gestionan por separado.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>Insumo *</Label>
                  <Select
                    value={formData.insumo_id}
                    onValueChange={(v) => setFormData({ ...formData, insumo_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un insumo" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {insumos?.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.nombre} ({getUnidadLabel(i.unidad_medida)})
                        </SelectItem>
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
                    <SelectContent className="max-h-60">
                      {proveedores?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad * {insumoSeleccionado && `(${getUnidadLabel(insumoSeleccionado.unidad_medida)})`}</Label>
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
                    <Label>Peso (opcional)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.peso}
                      onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                      placeholder="kg"
                    />
                  </div>
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
                
                {formData.cantidad && formData.precio_compra && (
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <span className="text-sm text-muted-foreground">Precio por unidad: </span>
                    <span className="font-semibold">
                      {(parseFloat(formData.precio_compra) / parseFloat(formData.cantidad)).toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                      {insumoSeleccionado && ` / ${getUnidadLabel(insumoSeleccionado.unidad_medida)}`}
                    </span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Compra</Label>
                    <Input
                      type="date"
                      value={formData.fecha_compra}
                      onChange={(e) => setFormData({ ...formData, fecha_compra: e.target.value })}
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
          <p className="text-muted-foreground">Cargando entradas...</p>
        ) : !entradas?.length ? (
          <p className="text-muted-foreground text-center py-8">No hay compras registradas</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Insumo</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Total</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead>Lote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entradas.map((entrada) => {
                const unidad = entrada.insumos_restaurante?.unidad_medida || "unidad";
                const precioUnitario = entrada.cantidad > 0 ? entrada.precio_compra / entrada.cantidad : 0;
                return (
                  <TableRow key={entrada.id}>
                    <TableCell>
                      {format(new Date(entrada.fecha_compra), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {entrada.insumos_restaurante?.nombre || "Insumo eliminado"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getUnidadLabel(unidad)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{entrada.proveedores?.nombre || "-"}</TableCell>
                    <TableCell className="text-right">
                      {entrada.cantidad} {getUnidadLabel(unidad)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {entrada.precio_compra.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {precioUnitario.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                    </TableCell>
                    <TableCell>{entrada.lote || "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
