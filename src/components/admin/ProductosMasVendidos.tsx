import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";

export function ProductosMasVendidos() {
  const [periodo, setPeriodo] = useState<string>("hoy");

  const { data: productosVendidos, isLoading } = useQuery({
    queryKey: ['productos-mas-vendidos', periodo],
    queryFn: async () => {
      let inicio: string;
      let fin: string;

      const hoy = new Date();

      switch (periodo) {
        case "hoy":
          inicio = startOfDay(hoy).toISOString();
          fin = endOfDay(hoy).toISOString();
          break;
        case "semana":
          inicio = subDays(hoy, 7).toISOString();
          fin = hoy.toISOString();
          break;
        case "mes":
          inicio = startOfMonth(hoy).toISOString();
          fin = endOfMonth(hoy).toISOString();
          break;
        default:
          inicio = startOfDay(hoy).toISOString();
          fin = endOfDay(hoy).toISOString();
      }

      // Obtener facturas del período
      const { data: facturas } = await supabase
        .from('facturas')
        .select('id')
        .gte('created_at', inicio)
        .lte('created_at', fin);

      if (!facturas || facturas.length === 0) return [];

      const facturaIds = facturas.map(f => f.id);

      // Obtener items de las facturas
      const { data: items } = await supabase
        .from('factura_items')
        .select('producto_nombre, cantidad')
        .in('factura_id', facturaIds);

      // Agrupar por producto
      const productosMap = new Map<string, number>();
      items?.forEach(item => {
        const cantidad = productosMap.get(item.producto_nombre) || 0;
        productosMap.set(item.producto_nombre, cantidad + item.cantidad);
      });

      // Convertir a array y ordenar
      const resultado = Array.from(productosMap.entries())
        .map(([nombre, cantidad]) => ({
          nombre: nombre.length > 20 ? nombre.substring(0, 20) + '...' : nombre,
          cantidad,
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

      return resultado;
    },
    refetchInterval: 30000,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <CardDescription>Top 5 productos del período</CardDescription>
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">7 días</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        ) : productosVendidos && productosVendidos.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productosVendidos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                dataKey="nombre" 
                type="category" 
                width={100}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: any) => [value, 'Cantidad vendida']}
              />
              <Bar 
                dataKey="cantidad" 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
