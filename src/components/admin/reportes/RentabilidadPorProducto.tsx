import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/utils/formatCurrency";
import { Utensils, AlertTriangle } from "lucide-react";

interface Props {
  fechaInicio?: Date;
  fechaFin?: Date;
  margenMinimo?: number;
}

interface Fila {
  producto_id: string;
  nombre: string;
  origen: string;
  cantidad: number;
  ventas: number;
  costo: number;
  ganancia: number;
  margen: number;
}

export function RentabilidadPorProducto({ fechaInicio, fechaFin, margenMinimo = 20 }: Props) {
  const desde = fechaInicio?.toISOString();
  const hasta = fechaFin?.toISOString();

  const { data: costos } = useQuery({
    queryKey: ["rentabilidad-productos", "costos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vista_costos_productos")
        .select("producto_id, nombre, precio, costo_unitario, origen_costo, insumos_en_receta");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: items } = useQuery({
    queryKey: ["rentabilidad-productos", "items", desde, hasta],
    queryFn: async () => {
      let query = supabase
        .from("factura_items")
        .select("producto_id, producto_nombre, cantidad, subtotal, facturas!inner(created_at)");
      if (desde) query = query.gte("facturas.created_at", desde);
      if (hasta) query = query.lte("facturas.created_at", hasta);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filas: Fila[] = useMemo(() => {
    if (!items || !costos) return [];

    const porId = new Map(costos.map((c) => [c.producto_id as string, c]));
    const porNombre = new Map(costos.map((c) => [(c.nombre as string)?.toLowerCase(), c]));
    const acc = new Map<string, Fila>();

    items.forEach((item) => {
      const info =
        (item.producto_id ? porId.get(item.producto_id) : undefined) ||
        porNombre.get(item.producto_nombre?.toLowerCase());
      const key = (info?.producto_id as string) || item.producto_nombre;
      const costoUnitario = Number(info?.costo_unitario || 0);
      const prev =
        acc.get(key) ||
        ({
          producto_id: key,
          nombre: (info?.nombre as string) || item.producto_nombre,
          origen: (info?.origen_costo as string) || "sin_datos",
          cantidad: 0,
          ventas: 0,
          costo: 0,
          ganancia: 0,
          margen: 0,
        } as Fila);

      prev.cantidad += item.cantidad;
      prev.ventas += Number(item.subtotal || 0);
      prev.costo += costoUnitario * item.cantidad;
      acc.set(key, prev);
    });

    return Array.from(acc.values())
      .map((f) => {
        f.ganancia = f.ventas - f.costo;
        f.margen = f.ventas > 0 ? (f.ganancia / f.ventas) * 100 : 0;
        return f;
      })
      .sort((a, b) => b.ventas - a.ventas);
  }, [items, costos]);

  const totales = filas.reduce(
    (acc, f) => ({
      ventas: acc.ventas + f.ventas,
      costo: acc.costo + f.costo,
    }),
    { ventas: 0, costo: 0 }
  );
  const margenTotal =
    totales.ventas > 0 ? ((totales.ventas - totales.costo) / totales.ventas) * 100 : 0;
  const sinCosteo = filas.filter((f) => f.origen === "sin_datos");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-primary" />
          Rentabilidad por producto / plato
        </CardTitle>
        <CardDescription>
          Costo real calculado con la receta de insumos (cantidades consumidas × costo promedio de
          compra) y, para productos de reventa, con el costo promedio de compra.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Ventas del período</p>
            <p className="text-lg font-bold">{formatCOP(totales.ventas)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Costo de insumos vendidos</p>
            <p className="text-lg font-bold">{formatCOP(totales.costo)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Margen real</p>
            <p
              className={`text-lg font-bold ${
                margenTotal >= margenMinimo ? "text-green-600" : "text-destructive"
              }`}
            >
              {margenTotal.toFixed(1)}%
            </p>
          </div>
        </div>

        {sinCosteo.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
            <p>
              {sinCosteo.length} producto(s) sin costo definido. Cárgales la ficha técnica en
              Inventario → Recetas para que su margen sea real.
            </p>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Vendidos</TableHead>
              <TableHead className="text-right">Ventas</TableHead>
              <TableHead className="text-right">Costo real</TableHead>
              <TableHead className="text-right">Ganancia</TableHead>
              <TableHead className="text-right">Margen</TableHead>
              <TableHead>Origen costo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No hay ventas en el período seleccionado.
                </TableCell>
              </TableRow>
            )}
            {filas.map((f) => (
              <TableRow key={f.producto_id}>
                <TableCell className="font-medium">{f.nombre}</TableCell>
                <TableCell className="text-right">{f.cantidad}</TableCell>
                <TableCell className="text-right">{formatCOP(f.ventas)}</TableCell>
                <TableCell className="text-right">{formatCOP(f.costo)}</TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    f.ganancia >= 0 ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {formatCOP(f.ganancia)}
                </TableCell>
                <TableCell
                  className={`text-right font-bold ${
                    f.margen >= margenMinimo ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {f.margen.toFixed(1)}%
                </TableCell>
                <TableCell>
                  <Badge variant={f.origen === "sin_datos" ? "destructive" : "secondary"}>
                    {f.origen === "receta"
                      ? "Receta"
                      : f.origen === "compra"
                      ? "Compra"
                      : "Sin costo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
