import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Boxes, AlertTriangle, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

interface InsumoStock {
  id: string;
  nombre: string;
  descripcion: string | null;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  precio_referencia: number;
  updated_at: string;
  tipos_insumos: { nombre: string } | null;
}

export const StockActual = () => {
  const [busqueda, setBusqueda] = useState("");

  const { data: insumos, isLoading } = useQuery({
    queryKey: ["insumos-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insumos_restaurante")
        .select(`
          id,
          nombre,
          descripcion,
          unidad_medida,
          stock_actual,
          stock_minimo,
          precio_referencia,
          updated_at,
          tipos_insumos:tipo_insumo_id(nombre)
        `)
        .eq("activo", true)
        .order("stock_actual", { ascending: true });
      if (error) throw error;
      return data as InsumoStock[];
    },
  });

  const insumosFiltrados = insumos?.filter(item =>
    item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.tipos_insumos?.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const stockBajo = insumos?.filter(item => item.stock_actual <= item.stock_minimo) || [];

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

  return (
    <div className="space-y-6">
      {stockBajo.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Stock Bajo ({stockBajo.length} insumos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stockBajo.map(item => (
                <Badge key={item.id} variant="destructive" className="text-sm">
                  {item.nombre}: {item.stock_actual} {getUnidadLabel(item.unidad_medida)}
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
                Stock de Insumos
              </CardTitle>
              <CardDescription>
                Inventario actual de insumos y materias primas (no productos de venta)
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar insumo..."
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
          ) : !insumosFiltrados?.length ? (
            <p className="text-muted-foreground text-center py-8">
              {busqueda ? "No se encontraron insumos" : "No hay insumos registrados. Ve a 'Gestión de Insumos' para crear insumos."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                  <TableHead className="text-right">Stock Mínimo</TableHead>
                  <TableHead className="text-right">Precio Ref.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Actualización</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insumosFiltrados.map((item) => {
                  const esBajo = item.stock_actual <= item.stock_minimo;
                  return (
                    <TableRow key={item.id} className={esBajo ? "bg-destructive/5" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.nombre}</p>
                          {item.descripcion && (
                            <p className="text-xs text-muted-foreground">{item.descripcion}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.tipos_insumos?.nombre || "Sin tipo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.stock_actual} {getUnidadLabel(item.unidad_medida)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.stock_minimo} {getUnidadLabel(item.unidad_medida)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.precio_referencia.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={esBajo ? "destructive" : "secondary"}>
                          {esBajo ? "Stock Bajo" : "Normal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(item.updated_at), "dd MMM yyyy HH:mm", { locale: es })}
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
