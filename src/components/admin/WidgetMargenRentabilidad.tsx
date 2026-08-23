import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ProductoRentabilidad {
  id: string;
  nombre: string;
  precio: number;
  costo: number;
  margen: number;
}

export function WidgetMargenRentabilidad() {
  const [productosConMargen, setProductosConMargen] = useState<ProductoRentabilidad[]>([]);

  // Obtener configuración de alertas
  const { data: config } = useQuery({
    queryKey: ["alertas-config-widget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alertas_rentabilidad_config")
        .select("*")
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Obtener costos reales por producto (receta de insumos o costo promedio de compra)
  const { data: costos } = useQuery({
    queryKey: ["costos-productos-widget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vista_costos_productos")
        .select("producto_id, nombre, precio, costo_unitario, origen_costo");

      if (error) throw error;
      return data || [];
    },
  });

  // Calcular márgenes cuando cambian los datos
  useEffect(() => {
    if (!costos) return;

    const productosCalculados = costos
      .filter((c) => c.origen_costo !== "sin_datos" && Number(c.precio) > 0)
      .map((c) => {
        const costo = Number(c.costo_unitario || 0);
        const precio = Number(c.precio || 0);
        return {
          id: c.producto_id as string,
          nombre: c.nombre as string,
          precio,
          costo,
          margen: ((precio - costo) / precio) * 100,
        };
      });

    setProductosConMargen(productosCalculados);
  }, [costos]);


  // Suscripción a cambios en tiempo real (compras e insumos afectan el costo real)
  useEffect(() => {
    const refrescar = () =>
      queryClient.invalidateQueries({ queryKey: ["costos-productos-widget"] });

    const channel = supabase
      .channel('rentabilidad-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario_entradas' }, refrescar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario_entradas_insumos' }, refrescar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recetas_productos' }, refrescar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);


  const margenMinimo = config?.margen_minimo || 20;
  const productosMargenBajo = productosConMargen.filter(p => p.margen < margenMinimo);
  const productosMargenAlto = productosConMargen.filter(p => p.margen >= margenMinimo);
  
  const margenPromedio = productosConMargen.length > 0
    ? productosConMargen.reduce((acc, p) => acc + p.margen, 0) / productosConMargen.length
    : 0;

  const estadoGeneral = margenPromedio >= margenMinimo ? "saludable" : "alerta";

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Margen de Rentabilidad</CardTitle>
        {estadoGeneral === "saludable" ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Margen promedio */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Margen promedio</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${margenPromedio >= margenMinimo ? 'text-green-500' : 'text-red-500'}`}>
                {margenPromedio.toFixed(1)}%
              </span>
              {margenPromedio >= margenMinimo ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>

          {/* Indicadores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{productosMargenAlto.length}</p>
              <p className="text-xs text-muted-foreground">Margen OK</p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{productosMargenBajo.length}</p>
              <p className="text-xs text-muted-foreground">Margen Bajo</p>
            </div>
          </div>

          {/* Lista de productos con margen bajo */}
          {productosMargenBajo.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Productos en alerta:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {productosMargenBajo.slice(0, 5).map((producto) => (
                  <div 
                    key={producto.id} 
                    className="flex items-center justify-between text-xs bg-red-500/5 rounded px-2 py-1"
                  >
                    <span className="truncate flex-1">{producto.nombre}</span>
                    <span className="text-red-600 font-medium ml-2">
                      {producto.margen.toFixed(1)}%
                    </span>
                  </div>
                ))}
                {productosMargenBajo.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{productosMargenBajo.length - 5} más
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Umbral configurado */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Umbral mínimo: <span className="font-medium">{margenMinimo}%</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
