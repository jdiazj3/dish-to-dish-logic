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
import { Plus, Pencil, Trash2, UtensilsCrossed, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface TipoInsumo {
  id: string;
  nombre: string;
}

interface Insumo {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_insumo_id: string | null;
  unidad_medida: string;
  peso_estandar: number;
  precio_referencia: number;
  stock_minimo: number;
  stock_actual: number;
  activo: boolean;
  tipos_insumos: { nombre: string } | null;
}

const UNIDADES_MEDIDA = [
  { value: "unidad", label: "Unidad" },
  { value: "kg", label: "Kilogramo (kg)" },
  { value: "g", label: "Gramo (g)" },
  { value: "lb", label: "Libra (lb)" },
  { value: "lt", label: "Litro (lt)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "paquete", label: "Paquete" },
  { value: "caja", label: "Caja" },
];

export const GestionInsumos = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Insumo | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo_insumo_id: "",
    unidad_medida: "unidad",
    peso_estandar: "",
    precio_referencia: "",
    stock_minimo: "",
  });

  const { data: tipos } = useQuery({
    queryKey: ["tipos-insumos-activos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_insumos")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return data as TipoInsumo[];
    },
  });

  const { data: insumos, isLoading } = useQuery({
    queryKey: ["insumos-restaurante"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insumos_restaurante")
        .select(`
          *,
          tipos_insumos:tipo_insumo_id(nombre)
        `)
        .order("nombre");
      if (error) throw error;
      return data as Insumo[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("insumos_restaurante").insert([{
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        tipo_insumo_id: data.tipo_insumo_id || null,
        unidad_medida: data.unidad_medida,
        peso_estandar: parseFloat(data.peso_estandar) || 0,
        precio_referencia: parseFloat(data.precio_referencia) || 0,
        stock_minimo: parseFloat(data.stock_minimo) || 0,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insumos-restaurante"] });
      toast.success("Insumo creado exitosamente");
      resetForm();
    },
    onError: () => toast.error("Error al crear insumo"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("insumos_restaurante").update({
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        tipo_insumo_id: data.tipo_insumo_id || null,
        unidad_medida: data.unidad_medida,
        peso_estandar: parseFloat(data.peso_estandar) || 0,
        precio_referencia: parseFloat(data.precio_referencia) || 0,
        stock_minimo: parseFloat(data.stock_minimo) || 0,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insumos-restaurante"] });
      toast.success("Insumo actualizado");
      resetForm();
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("insumos_restaurante").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insumos-restaurante"] });
      toast.success("Insumo eliminado");
    },
    onError: () => toast.error("Error al eliminar. Puede tener entradas asociadas."),
  });

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.from("insumos_restaurante").update({ activo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insumos-restaurante"] });
      toast.success("Estado actualizado");
    },
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      tipo_insumo_id: "",
      unidad_medida: "unidad",
      peso_estandar: "",
      precio_referencia: "",
      stock_minimo: "",
    });
    setEditando(null);
    setDialogOpen(false);
  };

  const handleEdit = (insumo: Insumo) => {
    setEditando(insumo);
    setFormData({
      nombre: insumo.nombre,
      descripcion: insumo.descripcion || "",
      tipo_insumo_id: insumo.tipo_insumo_id || "",
      unidad_medida: insumo.unidad_medida,
      peso_estandar: insumo.peso_estandar?.toString() || "",
      precio_referencia: insumo.precio_referencia?.toString() || "",
      stock_minimo: insumo.stock_minimo?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (editando) {
      updateMutation.mutate({ id: editando.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const insumosFiltrados = insumos?.filter(i =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.tipos_insumos?.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const insumosStockBajo = insumos?.filter(i => i.stock_actual <= i.stock_minimo && i.activo) || [];

  return (
    <div className="space-y-6">
      {insumosStockBajo.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Stock Bajo ({insumosStockBajo.length} insumos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insumosStockBajo.map(insumo => (
                <Badge key={insumo.id} variant="destructive" className="text-sm">
                  {insumo.nombre}: {insumo.stock_actual} {insumo.unidad_medida}
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
                <UtensilsCrossed className="w-5 h-5" />
                Insumos del Restaurante
              </CardTitle>
              <CardDescription>Gestiona los ingredientes e insumos de cocina</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar insumo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9 w-60"
                />
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Insumo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editando ? "Editar Insumo" : "Nuevo Insumo"}</DialogTitle>
                    <DialogDescription>
                      {editando ? "Modifica los datos del insumo" : "Registra un nuevo ingrediente o insumo"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Arroz, Pollo, Aceite"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Insumo</Label>
                        <Select
                          value={formData.tipo_insumo_id}
                          onValueChange={(v) => setFormData({ ...formData, tipo_insumo_id: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tipos?.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Unidad de Medida</Label>
                        <Select
                          value={formData.unidad_medida}
                          onValueChange={(v) => setFormData({ ...formData, unidad_medida: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIDADES_MEDIDA.map((u) => (
                              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Peso Estándar</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.peso_estandar}
                          onChange={(e) => setFormData({ ...formData, peso_estandar: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Precio Ref.</Label>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={formData.precio_referencia}
                          onChange={(e) => setFormData({ ...formData, precio_referencia: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock Mínimo</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.stock_minimo}
                          onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Descripción o notas adicionales"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                      {editando ? "Guardar" : "Crear"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando insumos...</p>
          ) : !insumosFiltrados?.length ? (
            <p className="text-muted-foreground text-center py-8">
              {busqueda ? "No se encontraron insumos" : "No hay insumos registrados"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                  <TableHead className="text-right">Stock Mín.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insumosFiltrados.map((insumo) => {
                  const stockBajo = insumo.stock_actual <= insumo.stock_minimo;
                  return (
                    <TableRow key={insumo.id} className={stockBajo && insumo.activo ? "bg-destructive/5" : ""}>
                      <TableCell className="font-medium">{insumo.nombre}</TableCell>
                      <TableCell>{insumo.tipos_insumos?.nombre || "-"}</TableCell>
                      <TableCell>{insumo.unidad_medida}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {insumo.stock_actual}
                      </TableCell>
                      <TableCell className="text-right">{insumo.stock_minimo}</TableCell>
                      <TableCell>
                        <Badge
                          variant={insumo.activo ? (stockBajo ? "destructive" : "default") : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleActivoMutation.mutate({ id: insumo.id, activo: !insumo.activo })}
                        >
                          {!insumo.activo ? "Inactivo" : stockBajo ? "Stock Bajo" : "Activo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(insumo)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(insumo.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
