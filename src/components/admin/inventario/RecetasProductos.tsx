import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChefHat } from "lucide-react";
import { toast } from "sonner";
import { formatCOP } from "@/utils/formatCurrency";
import { logError } from "@/utils/errorLogger";

export const RecetasProductos = () => {
  const queryClient = useQueryClient();
  const [productoId, setProductoId] = useState<string>("");
  const [insumoId, setInsumoId] = useState<string>("");
  const [cantidad, setCantidad] = useState<string>("");

  const { data: productos } = useQuery({
    queryKey: ["productos-recetas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio, controla_inventario")
        .order("nombre");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: costosInsumos } = useQuery({
    queryKey: ["vista-costos-insumos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vista_costos_insumos")
        .select("insumo_id, nombre, unidad_medida, costo_unitario, tiene_compras")
        .order("nombre");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: receta, isLoading } = useQuery({
    queryKey: ["receta-producto", productoId],
    enabled: !!productoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recetas_productos")
        .select("id, insumo_id, cantidad, insumos_restaurante(nombre, unidad_medida)")
        .eq("producto_id", productoId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: costoProducto } = useQuery({
    queryKey: ["vista-costo-producto", productoId],
    enabled: !!productoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vista_costos_productos")
        .select("costo_unitario, margen, origen_costo")
        .eq("producto_id", productoId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["receta-producto", productoId] });
    queryClient.invalidateQueries({ queryKey: ["vista-costo-producto", productoId] });
    queryClient.invalidateQueries({ queryKey: ["rentabilidad-productos"] });
    queryClient.invalidateQueries({ queryKey: ["costos-productos-widget"] });
  };

  const agregar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("recetas_productos").upsert(
        {
          producto_id: productoId,
          insumo_id: insumoId,
          cantidad: parseFloat(cantidad),
        },
        { onConflict: "producto_id,insumo_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Insumo agregado a la receta");
      setInsumoId("");
      setCantidad("");
      invalidar();
    },
    onError: (error) => {
      logError("Error al guardar receta:", error);
      toast.error("No se pudo guardar el insumo en la receta");
    },
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recetas_productos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Insumo eliminado de la receta");
      invalidar();
    },
    onError: (error) => {
      logError("Error al eliminar receta:", error);
      toast.error("No se pudo eliminar el insumo");
    },
  });

  const costoInsumo = (id: string) =>
    Number(costosInsumos?.find((c) => c.insumo_id === id)?.costo_unitario || 0);

  const productoSel = productos?.find((p) => p.id === productoId);
  const costoTotal = (receta || []).reduce(
    (acc, r) => acc + Number(r.cantidad) * costoInsumo(r.insumo_id),
    0
  );
  const margen =
    productoSel && productoSel.precio > 0
      ? ((productoSel.precio - costoTotal) / productoSel.precio) * 100
      : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            Ficha técnica (receta) por plato
          </CardTitle>
          <CardDescription>
            Define qué insumos y en qué cantidad consume cada plato. Con esto el costo y el margen de
            rentabilidad se calculan con precios reales de compra.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-md space-y-2">
            <Label>Producto / plato</Label>
            <Select value={productoId} onValueChange={setProductoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {productos?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} — {formatCOP(p.precio)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {productoId && (
            <>
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] items-end">
                <div className="space-y-2">
                  <Label>Insumo</Label>
                  <Select value={insumoId} onValueChange={setInsumoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      {costosInsumos?.map((i) => (
                        <SelectItem key={i.insumo_id} value={i.insumo_id!}>
                          {i.nombre} ({i.unidad_medida}) — {formatCOP(Number(i.costo_unitario || 0))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad consumida</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="Ej: 0.25"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (!insumoId || !cantidad || parseFloat(cantidad) <= 0) {
                      toast.error("Selecciona un insumo y una cantidad válida");
                      return;
                    }
                    agregar.mutate();
                  }}
                  disabled={agregar.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Costo unitario</TableHead>
                    <TableHead>Costo en el plato</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={5}>Cargando…</TableCell>
                    </TableRow>
                  )}
                  {!isLoading && (receta || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        Sin insumos en la receta todavía.
                      </TableCell>
                    </TableRow>
                  )}
                  {(receta || []).map((r) => {
                    const insumo = r.insumos_restaurante as unknown as {
                      nombre: string;
                      unidad_medida: string;
                    } | null;
                    const cu = costoInsumo(r.insumo_id);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{insumo?.nombre || "—"}</TableCell>
                        <TableCell>
                          {Number(r.cantidad)} {insumo?.unidad_medida}
                        </TableCell>
                        <TableCell>{formatCOP(cu)}</TableCell>
                        <TableCell>{formatCOP(Number(r.cantidad) * cu)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminar.mutate(r.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Costo del plato</p>
                  <p className="text-xl font-bold">{formatCOP(costoTotal)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Precio de venta</p>
                  <p className="text-xl font-bold">{formatCOP(productoSel?.precio || 0)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">Margen real</p>
                  <p
                    className={`text-xl font-bold ${
                      margen >= 20 ? "text-green-600" : "text-destructive"
                    }`}
                  >
                    {margen.toFixed(1)}%
                  </p>
                </div>
              </div>

              {costoProducto?.origen_costo === "compra" && (
                <Badge variant="secondary">
                  Este producto usa el costo promedio de compra (reventa), no una receta.
                </Badge>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
