import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, ShoppingCart, Save } from "lucide-react";

type ProductoOrden = {
  id?: string;
  silla: number;
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio: number;
  isNew?: boolean;
};

export default function EditarOrden() {
  const { ordenId } = useParams<{ ordenId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [productos, setProductos] = useState<ProductoOrden[]>([]);
  const [productosEliminados, setProductosEliminados] = useState<string[]>([]);
  const [sillaActual, setSillaActual] = useState(1);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const { data: orden, isLoading: ordenLoading } = useQuery({
    queryKey: ['orden', ordenId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*, mesas(numero, capacidad_sillas, salones(nombre))')
        .eq('id', ordenId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!ordenId,
  });

  const { data: ordenProductos, isLoading: productosLoading } = useQuery({
    queryKey: ['orden-productos', ordenId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orden_productos')
        .select('*, productos(nombre)')
        .eq('orden_id', ordenId);
      if (error) throw error;
      return data;
    },
    enabled: !!ordenId,
  });

  const { data: productosMenu } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('disponible', true)
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (ordenProductos) {
      setProductos(ordenProductos.map(p => ({
        id: p.id,
        silla: p.numero_silla,
        producto_id: p.producto_id,
        producto_nombre: p.productos?.nombre || '',
        cantidad: p.cantidad,
        precio: Number(p.precio_unitario),
      })));
    }
  }, [ordenProductos]);

  const guardarCambiosMutation = useMutation({
    mutationFn: async () => {
      // Eliminar productos marcados
      if (productosEliminados.length > 0) {
        const { error: deleteError } = await supabase
          .from('orden_productos')
          .delete()
          .in('id', productosEliminados);
        if (deleteError) throw deleteError;
      }

      // Actualizar productos existentes
      for (const producto of productos.filter(p => p.id && !p.isNew)) {
        const { error } = await supabase
          .from('orden_productos')
          .update({
            cantidad: producto.cantidad,
            numero_silla: producto.silla,
            subtotal: producto.precio * producto.cantidad
          })
          .eq('id', producto.id);
        if (error) throw error;
      }

      // Insertar nuevos productos
      const nuevosProductos = productos.filter(p => p.isNew);
      if (nuevosProductos.length > 0) {
        const { error } = await supabase
          .from('orden_productos')
          .insert(nuevosProductos.map(p => ({
            orden_id: ordenId,
            producto_id: p.producto_id,
            numero_silla: p.silla,
            cantidad: p.cantidad,
            precio_unitario: p.precio,
            subtotal: p.precio * p.cantidad
          })));
        if (error) throw error;
      }

      // Actualizar total de la orden
      const nuevoTotal = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
      const { error: ordenError } = await supabase
        .from('ordenes')
        .update({ total: nuevoTotal })
        .eq('id', ordenId);
      if (ordenError) throw ordenError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      queryClient.invalidateQueries({ queryKey: ['orden', ordenId] });
      queryClient.invalidateQueries({ queryKey: ['orden-productos', ordenId] });
      toast.success("Orden actualizada exitosamente");
      navigate('/mesero');
    },
    onError: (error: any) => {
      toast.error("Error al actualizar la orden", {
        description: error.message
      });
    }
  });

  const agregarProducto = () => {
    if (!productoSeleccionado) {
      toast.error("Selecciona un producto");
      return;
    }

    const producto = productosMenu?.find(p => p.id === productoSeleccionado);
    if (!producto) return;

    setProductos([...productos, {
      silla: sillaActual,
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      cantidad,
      precio: Number(producto.precio),
      isNew: true
    }]);

    setProductoSeleccionado("");
    setCantidad(1);
    toast.success(`${producto.nombre} agregado a la orden`);
  };

  const eliminarProducto = (index: number) => {
    const producto = productos[index];
    if (producto.id && !producto.isNew) {
      setProductosEliminados([...productosEliminados, producto.id]);
    }
    setProductos(productos.filter((_, i) => i !== index));
  };

  const actualizarCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    const nuevosProductos = [...productos];
    nuevosProductos[index].cantidad = nuevaCantidad;
    setProductos(nuevosProductos);
  };

  if (ordenLoading || productosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando orden...
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p>Orden no encontrada</p>
        <Button onClick={() => navigate('/mesero')}>Volver</Button>
      </div>
    );
  }

  if (orden.estado !== 'recibida') {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p>Esta orden ya no puede ser editada (estado: {orden.estado})</p>
        <Button onClick={() => navigate('/mesero')}>Volver</Button>
      </div>
    );
  }

  if (orden.mesero_id !== user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p>No tienes permiso para editar esta orden</p>
        <Button onClick={() => navigate('/mesero')}>Volver</Button>
      </div>
    );
  }

  const total = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  const productosPorSilla = productos.reduce((acc, p) => {
    acc[p.silla] = (acc[p.silla] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const maxSillas = orden.mesas?.capacidad_sillas || 10;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate('/mesero')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="text-center">
            <h1 className="font-bold">Editar Orden</h1>
            <p className="text-sm text-muted-foreground">
              Mesa {orden.mesas?.numero} - {orden.mesas?.salones?.nombre}
            </p>
          </div>
          <Badge variant={orden.estado === 'recibida' ? 'destructive' : 'secondary'}>
            {orden.estado === 'recibida' ? 'En espera' : orden.estado}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Producto</CardTitle>
              <CardDescription>Añade productos a la orden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Silla</Label>
                <Select value={String(sillaActual)} onValueChange={(v) => setSillaActual(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxSillas }, (_, i) => i + 1).map(silla => (
                      <SelectItem key={silla} value={String(silla)}>
                        Silla {silla}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Producto</Label>
                <Select value={productoSeleccionado} onValueChange={setProductoSeleccionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productosMenu?.map(producto => (
                      <SelectItem key={producto.id} value={producto.id}>
                        {producto.nombre} - ${Number(producto.precio).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                />
              </div>

              <Button onClick={agregarProducto} className="w-full bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Productos de la Orden</span>
                <Badge variant="secondary">
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  {productos.length} items
                </Badge>
              </CardTitle>
              <CardDescription>Edita cantidades o elimina productos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(productosPorSilla).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(productosPorSilla).map(([silla, count]) => (
                    <Badge key={silla} variant="outline">
                      Silla {silla}: {count} producto(s)
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {productos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay productos en la orden
                  </p>
                ) : (
                  productos.map((producto, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{producto.producto_nombre}</p>
                          {producto.isNew && (
                            <Badge variant="secondary" className="text-xs">Nuevo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Silla {producto.silla} • ${producto.precio.toFixed(2)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={producto.cantidad}
                          onChange={(e) => actualizarCantidad(index, Number(e.target.value))}
                          className="w-16 text-center"
                        />
                        <span className="font-bold w-20 text-right">
                          ${(producto.precio * producto.cantidad).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarProducto(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                onClick={() => guardarCambiosMutation.mutate()} 
                disabled={productos.length === 0 || guardarCambiosMutation.isPending}
                className="w-full bg-gradient-success"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {guardarCambiosMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
