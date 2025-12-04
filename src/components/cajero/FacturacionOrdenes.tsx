import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, DollarSign, Users, Printer, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function FacturacionOrdenes() {
  const { user } = useAuth();
  const [selectedOrden, setSelectedOrden] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoFacturacion, setTipoFacturacion] = useState<"completa" | "silla">("completa");
  const [sillasSeleccionadas, setSillasSeleccionadas] = useState<number[]>([]);
  const [propinaPorcentaje, setPropinaPorcentaje] = useState(10);
  const [facturaGenerada, setFacturaGenerada] = useState<any>(null);
  const [dialogExito, setDialogExito] = useState(false);
  const queryClient = useQueryClient();

  const { data: ordenesEntregadas, isLoading, error } = useQuery({
    queryKey: ['ordenes-entregadas'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('ordenes')
          .select(`
            *,
            mesas(numero, salones(nombre)),
            orden_productos(*, productos(nombre))
          `)
          .eq('estado', 'entregada')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error al cargar órdenes:', error);
          throw error;
        }
        
        // Filtrar órdenes que tienen productos sin facturar
        const ordenesConProductosPendientes = data?.filter(orden => {
          const productosPendientes = orden.orden_productos?.filter((p: any) => !p.facturado) || [];
          return productosPendientes.length > 0;
        }) || [];
        
        return ordenesConProductosPendientes;
      } catch (err) {
        console.error('Error en queryFn:', err);
        throw err;
      }
    },
    retry: 1,
  });

  // Suscripción en tiempo real para órdenes
  useEffect(() => {
    const channel = supabase
      .channel('ordenes-cajero')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordenes',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ordenes-entregadas'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orden_productos',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ordenes-entregadas'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const facturarMutation = useMutation({
    mutationFn: async ({ ordenId, items, totales }: any) => {
      // Crear la factura
      const { data: factura, error: facturaError } = await supabase
        .from('facturas')
        .insert({
          orden_id: ordenId,
          cajero_id: user?.id,
          nombre_cliente: selectedOrden.nombre_cliente || 'Cliente',
          subtotal: totales.subtotal,
          impuestos: totales.impuestos,
          propina: totales.propina,
          total: totales.total,
        })
        .select()
        .single();

      if (facturaError) throw facturaError;

      // Crear los items de la factura
      const facturaItems = items.map((item: any) => ({
        factura_id: factura.id,
        orden_producto_id: item.id,
        producto_nombre: item.productos.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('factura_items')
        .insert(facturaItems);

      if (itemsError) throw itemsError;

      // Marcar los productos como facturados
      const productIds = items.map((item: any) => item.id);
      const { error: updateError } = await supabase
        .from('orden_productos')
        .update({ facturado: true })
        .in('id', productIds);

      if (updateError) throw updateError;

      // Verificar si todos los productos de la orden están facturados
      const { data: productosRestantes } = await supabase
        .from('orden_productos')
        .select('id')
        .eq('orden_id', ordenId)
        .eq('facturado', false);

      // Si no quedan productos sin facturar, marcar la orden como facturada
      if (!productosRestantes || productosRestantes.length === 0) {
        await supabase
          .from('ordenes')
          .update({ estado: 'facturada' })
          .eq('id', ordenId);
      }

      return factura;
    },
    onSuccess: (factura) => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-entregadas'] });
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      setFacturaGenerada(factura);
      setDialogOpen(false);
      setDialogExito(true);
      resetForm();
    },
    onError: (error) => {
      console.error('Error al facturar:', error);
      toast.error("Error al generar la factura");
    },
  });

  const imprimirPDFMutation = useMutation({
    mutationFn: async (facturaId: string) => {
      const { data, error } = await supabase.functions.invoke('generar-factura-pdf', {
        body: { facturaId, enviarCorreo: false },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(data.html);
        ventana.document.close();
        setTimeout(() => ventana.print(), 500);
      }
      toast.success("Factura lista para imprimir");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al generar PDF");
    },
  });

  const resetForm = () => {
    setSelectedOrden(null);
    setTipoFacturacion("completa");
    setSillasSeleccionadas([]);
    setPropinaPorcentaje(10);
  };

  const handleFacturar = (orden: any) => {
    setSelectedOrden(orden);
    setDialogOpen(true);
  };

  const calcularTotales = () => {
    if (!selectedOrden) return { subtotal: 0, impuestos: 0, propina: 0, total: 0, items: [] };

    // Filtrar solo productos no facturados
    let items = selectedOrden.orden_productos.filter((item: any) => !item.facturado);
    
    if (tipoFacturacion === "silla" && sillasSeleccionadas.length > 0) {
      items = items.filter((item: any) => sillasSeleccionadas.includes(item.numero_silla));
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal), 0);
    const impuestos = subtotal * 0.19; // IVA 19%
    const propina = subtotal * (propinaPorcentaje / 100);
    const total = subtotal + impuestos + propina;

    return { subtotal, impuestos, propina, total, items };
  };

  // Obtener productos no facturados agrupados por silla
  const getProductosPorSilla = () => {
    if (!selectedOrden) return {};
    const productosPendientes = selectedOrden.orden_productos.filter((item: any) => !item.facturado);
    return productosPendientes.reduce((acc: any, item: any) => {
      const silla = item.numero_silla;
      if (!acc[silla]) {
        acc[silla] = { productos: [], total: 0 };
      }
      acc[silla].productos.push(item);
      acc[silla].total += parseFloat(item.subtotal);
      return acc;
    }, {});
  };

  const productosPorSilla = getProductosPorSilla();

  const confirmarFacturacion = () => {
    const totales = calcularTotales();
    
    if (tipoFacturacion === "silla" && sillasSeleccionadas.length === 0) {
      toast.error("Selecciona al menos una silla");
      return;
    }

    facturarMutation.mutate({
      ordenId: selectedOrden.id,
      items: totales.items,
      totales: {
        subtotal: totales.subtotal,
        impuestos: totales.impuestos,
        propina: totales.propina,
        total: totales.total,
      },
    });
  };

  // Obtener solo sillas con productos pendientes de facturar
  const sillasDisponibles = selectedOrden?.orden_productos
    ? Array.from(new Set(
        selectedOrden.orden_productos
          .filter((item: any) => !item.facturado)
          .map((item: any) => item.numero_silla)
      )).sort((a: number, b: number) => a - b)
    : [];

  const totales = calcularTotales();

  // Calcular pendiente por facturar de cada orden
  const calcularPendiente = (orden: any) => {
    const productosPendientes = orden.orden_productos?.filter((p: any) => !p.facturado) || [];
    return productosPendientes.reduce((sum: number, p: any) => sum + parseFloat(p.subtotal), 0);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Órdenes Pendientes de Facturar
          </CardTitle>
          <CardDescription>Órdenes entregadas con productos sin facturar</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando órdenes...</p>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">Error al cargar las órdenes</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          ) : ordenesEntregadas && ordenesEntregadas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Salón</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead>Sillas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenesEntregadas.map((orden) => {
                  const pendiente = calcularPendiente(orden);
                  const sillasPendientes = Array.from(new Set(
                    orden.orden_productos
                      ?.filter((p: any) => !p.facturado)
                      .map((p: any) => p.numero_silla)
                  )).sort((a: number, b: number) => a - b);
                  
                  return (
                    <TableRow key={orden.id}>
                      <TableCell>Mesa {orden.mesas?.numero}</TableCell>
                      <TableCell>{orden.mesas?.salones?.nombre}</TableCell>
                      <TableCell>{orden.nombre_cliente || "Sin nombre"}</TableCell>
                      <TableCell>{format(new Date(orden.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell className="font-semibold">${pendiente.toLocaleString('es-CO')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {sillasPendientes.map((silla: number) => (
                            <Badge key={silla} variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {silla}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => handleFacturar(orden)}>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Facturar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay órdenes pendientes de facturar
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Facturar Orden - Mesa {selectedOrden?.mesas?.numero}</DialogTitle>
            <DialogDescription>
              Cliente: {selectedOrden?.nombre_cliente || "Sin nombre"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Tipo de Facturación</Label>
              <RadioGroup value={tipoFacturacion} onValueChange={(value: any) => {
                setTipoFacturacion(value);
                setSillasSeleccionadas([]);
              }}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="completa" id="completa" />
                  <Label htmlFor="completa" className="cursor-pointer">
                    Facturar mesa completa
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="silla" id="silla" />
                  <Label htmlFor="silla" className="cursor-pointer">
                    Facturar por silla individual
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {tipoFacturacion === "silla" && (
              <div className="space-y-3">
                <Label>Seleccionar Sillas a Facturar</Label>
                <div className="space-y-3">
                  {sillasDisponibles.map((silla: number) => {
                    const sillaData = productosPorSilla[silla];
                    return (
                      <div key={silla} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`silla-${silla}`}
                              checked={sillasSeleccionadas.includes(silla)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSillasSeleccionadas([...sillasSeleccionadas, silla]);
                                } else {
                                  setSillasSeleccionadas(sillasSeleccionadas.filter(s => s !== silla));
                                }
                              }}
                            />
                            <Label htmlFor={`silla-${silla}`} className="cursor-pointer font-semibold">
                              Silla {silla}
                            </Label>
                          </div>
                          <Badge variant="secondary">
                            ${sillaData?.total.toLocaleString('es-CO')}
                          </Badge>
                        </div>
                        <div className="ml-6 space-y-1">
                          {sillaData?.productos.map((item: any, idx: number) => (
                            <div key={idx} className="text-sm">
                              <span className="text-muted-foreground">
                                {item.cantidad}x {item.productos?.nombre} - ${parseFloat(item.subtotal).toLocaleString('es-CO')}
                              </span>
                              {item.notas && (
                                <p className="text-xs text-amber-600 italic ml-2">📝 {item.notas}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tipoFacturacion === "completa" && Object.keys(productosPorSilla).length > 0 && (
              <div className="space-y-3">
                <Label>Detalle de Productos por Silla</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(productosPorSilla).map(([silla, data]: [string, any]) => (
                    <div key={silla} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Silla {silla}</span>
                        <Badge variant="outline">${data.total.toLocaleString('es-CO')}</Badge>
                      </div>
                      <div className="space-y-1">
                        {data.productos.map((item: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            <span className="text-muted-foreground">
                              {item.cantidad}x {item.productos?.nombre}
                            </span>
                            {item.notas && (
                              <p className="text-xs text-amber-600 italic ml-2">📝 {item.notas}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="propina">Propina (%)</Label>
              <Input
                id="propina"
                type="number"
                min="0"
                max="100"
                value={propinaPorcentaje}
                onChange={(e) => setPropinaPorcentaje(Number(e.target.value))}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">${totales.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Impuestos (19%):</span>
                <span className="font-medium">${totales.impuestos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Propina ({propinaPorcentaje}%):</span>
                <span className="font-medium">${totales.propina.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span>${totales.total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmarFacturacion} disabled={facturarMutation.isPending}>
                {facturarMutation.isPending ? "Procesando..." : "Generar Factura"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de éxito con opción de imprimir */}
      <Dialog open={dialogExito} onOpenChange={setDialogExito}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-6 h-6" />
              Factura Generada
            </DialogTitle>
            <DialogDescription>
              La factura #{facturaGenerada?.consecutivo} se generó exitosamente
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 text-center">
            <p className="text-2xl font-bold text-primary mb-2">
              ${Number(facturaGenerada?.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground">Total facturado</p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogExito(false)}
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                if (facturaGenerada) {
                  imprimirPDFMutation.mutate(facturaGenerada.id);
                }
              }}
              disabled={imprimirPDFMutation.isPending}
              className="bg-gradient-primary"
            >
              <Printer className="w-4 h-4 mr-2" />
              {imprimirPDFMutation.isPending ? "Generando..." : "Imprimir Factura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
