import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function FacturacionOrdenes() {
  const { user } = useAuth();
  const [selectedOrden, setSelectedOrden] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoFacturacion, setTipoFacturacion] = useState<"completa" | "silla">("completa");
  const [sillasSeleccionadas, setSillasSeleccionadas] = useState<number[]>([]);
  const [propinaPorcentaje, setPropinaPorcentaje] = useState(10);
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
        
        // Filtrar solo las órdenes que no han sido facturadas
        const { data: facturas, error: facturasError } = await supabase
          .from('facturas')
          .select('orden_id');
        
        if (facturasError) {
          console.error('Error al cargar facturas:', facturasError);
        }
        
        const ordenesFacturadas = new Set(facturas?.map(f => f.orden_id) || []);
        return data?.filter(orden => !ordenesFacturadas.has(orden.id)) || [];
      } catch (err) {
        console.error('Error en queryFn:', err);
        throw err;
      }
    },
    retry: 1,
  });

  const facturarMutation = useMutation({
    mutationFn: async ({ ordenId, items, totales }: any) => {
      // Crear la factura
      const { data: factura, error: facturaError } = await supabase
        .from('facturas')
        .insert({
          orden_id: ordenId,
          cajero_id: user?.id,
          nombre_cliente: selectedOrden.nombre_cliente,
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

      return factura;
    },
    onSuccess: (factura) => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-entregadas'] });
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      toast.success(`Factura #${factura.consecutivo} generada exitosamente`);
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error al facturar:', error);
      toast.error("Error al generar la factura");
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
    if (!selectedOrden) return { subtotal: 0, impuestos: 0, propina: 0, total: 0 };

    let items = selectedOrden.orden_productos;
    
    if (tipoFacturacion === "silla" && sillasSeleccionadas.length > 0) {
      items = items.filter((item: any) => sillasSeleccionadas.includes(item.numero_silla));
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal), 0);
    const impuestos = subtotal * 0.19; // IVA 19%
    const propina = subtotal * (propinaPorcentaje / 100);
    const total = subtotal + impuestos + propina;

    return { subtotal, impuestos, propina, total, items };
  };

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

  const sillasDisponibles = selectedOrden?.orden_productos
    ? Array.from(new Set(selectedOrden.orden_productos.map((item: any) => item.numero_silla)))
    : [];

  const totales = calcularTotales();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Órdenes Pendientes de Facturar
          </CardTitle>
          <CardDescription>Órdenes entregadas que aún no han sido facturadas</CardDescription>
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
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenesEntregadas.map((orden) => (
                  <TableRow key={orden.id}>
                    <TableCell>Mesa {orden.mesas?.numero}</TableCell>
                    <TableCell>{orden.mesas?.salones?.nombre}</TableCell>
                    <TableCell>{orden.nombre_cliente || "Sin nombre"}</TableCell>
                    <TableCell>{format(new Date(orden.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="font-semibold">${Number(orden.total || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => handleFacturar(orden)}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Facturar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
                <Label>Seleccionar Sillas</Label>
                <div className="grid grid-cols-4 gap-3">
                  {sillasDisponibles.map((silla: number) => (
                    <div key={silla} className="flex items-center space-x-2">
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
                      <Label htmlFor={`silla-${silla}`} className="cursor-pointer">
                        Silla {silla}
                      </Label>
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
    </>
  );
}
