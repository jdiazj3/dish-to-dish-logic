import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, Plus, Trash2, ShoppingCart } from "lucide-react";
import { formatCOP } from "@/utils/formatCurrency";
import { ProductoPicker } from "@/components/ProductoPicker";

type ProductoSilla = {
  silla: number;
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio: number;
  notas?: string;
};

export default function CrearOrden() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [mesaId, setMesaId] = useState("");
  const [productos, setProductos] = useState<ProductoSilla[]>([]);
  const [sillaActual, setSillaActual] = useState(1);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState("");

  const { data: mesas } = useQuery({
    queryKey: ['mesas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mesas')
        .select('*, salones(nombre)')
        .eq('disponible', true)
        .order('numero');
      if (error) throw error;
      return data;
    },
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

  const turnoActual = (): 'manana' | 'tarde' | 'noche' => {
    const hora = new Date().getHours();
    if (hora < 12) return 'manana';
    if (hora < 18) return 'tarde';
    return 'noche';
  };

  const crearOrdenMutation = useMutation({
    mutationFn: async () => {
      if (!mesaId || productos.length === 0) {
        throw new Error("Selecciona una mesa y agrega productos");
      }

      const total = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);

      const { data: orden, error: ordenError } = await supabase
        .from('ordenes')
        .insert({
          mesa_id: mesaId,
          mesero_id: user?.id,
          turno: turnoActual(),
          total,
          estado: 'recibida'
        })
        .select()
        .single();

      if (ordenError) throw ordenError;

      const productosInsert = productos.map(p => ({
        orden_id: orden.id,
        producto_id: p.producto_id,
        numero_silla: p.silla,
        cantidad: p.cantidad,
        precio_unitario: p.precio,
        subtotal: p.precio * p.cantidad,
        notas: p.notas || null
      }));

      const { error: productosError } = await supabase
        .from('orden_productos')
        .insert(productosInsert);

      if (productosError) throw productosError;

      return orden;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-turnos'] });
      toast.success("Orden creada exitosamente", {
        description: "La cocina ha sido notificada"
      });
      navigate('/mesero');
    },
    onError: (error: any) => {
      toast.error("Error al crear la orden", {
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
      notas: notas.trim() || undefined
    }]);

    setProductoSeleccionado("");
    setCantidad(1);
    setNotas("");
    toast.success(`${producto.nombre} agregado a la orden`);
  };

  const eliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const total = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  const productosPorSilla = productos.reduce((acc, p) => {
    acc[p.silla] = (acc[p.silla] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/mesero')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Mesa</CardTitle>
              <CardDescription>Selecciona mesa y silla</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mesa</Label>
                <Select value={mesaId} onValueChange={setMesaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {mesas?.map(mesa => (
                      <SelectItem key={mesa.id} value={mesa.id}>
                        Mesa {mesa.numero} - {mesa.salones?.nombre} ({mesa.capacidad_sillas} sillas)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Silla</Label>
                <Input
                  type="number"
                  min="1"
                  value={sillaActual}
                  onChange={(e) => setSillaActual(Number(e.target.value))}
                />
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
                        {producto.nombre} - {formatCOP(producto.precio)}
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

              <div className="space-y-2">
                <Label>Notas especiales (opcional)</Label>
                <Input
                  placeholder="Ej: sin cebolla, extra picante..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  maxLength={200}
                />
              </div>

              <Button onClick={agregarProducto} className="w-full bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Agregar a la Orden
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Resumen de la Orden</span>
                <Badge variant="secondary">
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  {productos.length} items
                </Badge>
              </CardTitle>
              <CardDescription>Productos por silla</CardDescription>
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
                    No hay productos agregados
                  </p>
                ) : (
                  productos.map((producto, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{producto.producto_nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          Silla {producto.silla} • Cant: {producto.cantidad} • {formatCOP(producto.precio)} c/u
                        </p>
                        {producto.notas && (
                          <p className="text-xs text-amber-600 mt-1 italic">📝 {producto.notas}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatCOP(producto.precio * producto.cantidad)}</span>
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
                  <span className="text-primary">{formatCOP(total)}</span>
                </div>
              </div>

              <Button 
                onClick={() => crearOrdenMutation.mutate()} 
                disabled={productos.length === 0 || !mesaId || crearOrdenMutation.isPending}
                className="w-full bg-gradient-success"
                size="lg"
              >
                {crearOrdenMutation.isPending ? "Enviando..." : "Enviar a Cocina"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
