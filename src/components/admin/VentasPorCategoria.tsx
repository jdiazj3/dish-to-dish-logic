import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { startOfDay, endOfDay } from "date-fns";
import { formatCOP } from "@/utils/formatCurrency";
const COLORES = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function VentasPorCategoria() {
  const { data: ventasPorCategoria, isLoading } = useQuery({
    queryKey: ['ventas-por-categoria'],
    queryFn: async () => {
      const hoy = new Date();
      const inicioHoy = startOfDay(hoy).toISOString();
      const finHoy = endOfDay(hoy).toISOString();

      // Obtener facturas de hoy
      const { data: facturas } = await supabase
        .from('facturas')
        .select('id')
        .gte('created_at', inicioHoy)
        .lte('created_at', finHoy);

      if (!facturas || facturas.length === 0) return [];

      const facturaIds = facturas.map(f => f.id);

      // Obtener items con sus productos
      const { data: items } = await supabase
        .from('factura_items')
        .select('producto_nombre, subtotal, orden_producto_id')
        .in('factura_id', facturaIds);

      if (!items || items.length === 0) return [];

      // Obtener productos con categorías
      const { data: ordenProductos } = await supabase
        .from('orden_productos')
        .select('id, producto_id')
        .in('id', items.map(i => i.orden_producto_id).filter(Boolean));

      const productoIds = [...new Set(ordenProductos?.map(op => op.producto_id))];

      const { data: productos } = await supabase
        .from('productos')
        .select('id, categoria_id, categorias(nombre)')
        .in('id', productoIds);

      // Crear mapa de producto_id a categoría
      const productoCategoria = new Map();
      productos?.forEach(p => {
        if (p.categorias) {
          productoCategoria.set(p.id, p.categorias.nombre);
        }
      });

      // Crear mapa de orden_producto_id a producto_id
      const ordenProductoMap = new Map();
      ordenProductos?.forEach(op => {
        ordenProductoMap.set(op.id, op.producto_id);
      });

      // Agrupar ventas por categoría
      const categoriasMap = new Map<string, number>();
      items.forEach(item => {
        if (item.orden_producto_id) {
          const productoId = ordenProductoMap.get(item.orden_producto_id);
          const categoria = productoCategoria.get(productoId) || 'Sin categoría';
          const total = categoriasMap.get(categoria) || 0;
          categoriasMap.set(categoria, total + Number(item.subtotal));
        }
      });

      return Array.from(categoriasMap.entries()).map(([name, value]) => ({
        name,
        value: Math.round(value),
      }));
    },
    refetchInterval: 60000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por Categoría (Hoy)</CardTitle>
        <CardDescription>Distribución de ventas por categoría de producto</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        ) : ventasPorCategoria && ventasPorCategoria.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ventasPorCategoria}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {ventasPorCategoria.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: any) => [formatCOP(value), 'Ventas']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No hay datos disponibles para hoy</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
