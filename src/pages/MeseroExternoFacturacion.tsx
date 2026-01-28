import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Search, FileText, DollarSign, CreditCard, Banknote, Wallet, Building2, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCOP } from "@/utils/formatCurrency";

export default function MeseroExternoFacturacion() {
  const { user, loading: authLoading } = useAuth();
  const { data: roles, isLoading: rolesLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [busquedaLocal, setBusquedaLocal] = useState("");
  const [localSeleccionado, setLocalSeleccionado] = useState<string | null>(null);
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "debito" | "credito" | "nequi" | "daviplata">("efectivo");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [procesando, setProcesando] = useState(false);

  // Query para obtener órdenes de domicilio entregadas del día
  const { data: ordenesDomicilio, isLoading: ordenesLoading } = useQuery({
    queryKey: ['ordenes-domicilio-facturacion'],
    queryFn: async () => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          *,
          numero_orden,
          orden_productos(*, productos(nombre))
        `)
        .eq('es_domicilio', true)
        .eq('estado', 'entregada')
        .gte('created_at', hoy.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Filtrar órdenes con productos pendientes de facturar
      const ordenesConPendientes = data?.filter(orden => {
        const productosPendientes = orden.orden_productos?.filter((p: any) => !p.facturado) || [];
        return productosPendientes.length > 0;
      }) || [];
      
      return ordenesConPendientes;
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  // Agrupar órdenes por nombre_cliente (local/oficina)
  const ordenesPorLocal = useMemo(() => {
    if (!ordenesDomicilio) return {};
    
    return ordenesDomicilio.reduce((acc: { [key: string]: any[] }, orden) => {
      const nombreLocal = orden.nombre_cliente || 'Sin identificar';
      if (!acc[nombreLocal]) {
        acc[nombreLocal] = [];
      }
      acc[nombreLocal].push(orden);
      return acc;
    }, {});
  }, [ordenesDomicilio]);

  // Filtrar locales según búsqueda
  const localesFiltrados = useMemo(() => {
    const locales = Object.keys(ordenesPorLocal);
    if (!busquedaLocal.trim()) return locales;
    return locales.filter(local => 
      local.toLowerCase().includes(busquedaLocal.toLowerCase())
    );
  }, [ordenesPorLocal, busquedaLocal]);

  // Órdenes del local seleccionado
  const ordenesLocalSeleccionado = localSeleccionado ? ordenesPorLocal[localSeleccionado] || [] : [];

  // Calcular totales de órdenes seleccionadas
  const totalesSeleccionados = useMemo(() => {
    const ordenesParaFacturar = ordenesLocalSeleccionado.filter(o => 
      ordenesSeleccionadas.includes(o.id)
    );
    
    let subtotal = 0;
    let cantidadProductos = 0;
    
    ordenesParaFacturar.forEach(orden => {
      const productosPendientes = orden.orden_productos?.filter((p: any) => !p.facturado) || [];
      productosPendientes.forEach((p: any) => {
        subtotal += p.subtotal;
        cantidadProductos += p.cantidad;
      });
    });
    
    return { subtotal, cantidadProductos, cantidadOrdenes: ordenesParaFacturar.length };
  }, [ordenesLocalSeleccionado, ordenesSeleccionadas]);

  // Mutation para facturar
  const facturarMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !localSeleccionado) throw new Error("Datos incompletos");

      const ordenesParaFacturar = ordenesLocalSeleccionado.filter(o => 
        ordenesSeleccionadas.includes(o.id)
      );

      if (ordenesParaFacturar.length === 0) throw new Error("No hay órdenes seleccionadas");

      // Recopilar todos los productos pendientes de todas las órdenes seleccionadas
      const todosLosItems: any[] = [];
      let subtotalTotal = 0;

      ordenesParaFacturar.forEach(orden => {
        const productosPendientes = orden.orden_productos?.filter((p: any) => !p.facturado) || [];
        productosPendientes.forEach((p: any) => {
          todosLosItems.push(p);
          subtotalTotal += p.subtotal;
        });
      });

      // Crear la factura consolidada (sin orden_id ya que son múltiples órdenes)
      const { data: factura, error: facturaError } = await supabase
        .from('facturas')
        .insert({
          orden_id: null, // Factura consolidada sin orden específica
          cajero_id: user.id,
          nombre_cliente: localSeleccionado,
          subtotal: subtotalTotal,
          impuestos: 0,
          propina: 0,
          total: subtotalTotal,
          metodo_pago: metodoPago,
          referencia_pago: referenciaPago || null,
        })
        .select()
        .single();

      if (facturaError) throw facturaError;

      // Crear los items de la factura
      const facturaItems = todosLosItems.map((item: any) => ({
        factura_id: factura.id,
        orden_producto_id: item.id,
        producto_nombre: item.productos?.nombre || 'Producto',
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('factura_items')
        .insert(facturaItems);

      if (itemsError) throw itemsError;

      // Marcar los productos como facturados
      const productIds = todosLosItems.map((item: any) => item.id);
      const { error: updateError } = await supabase
        .from('orden_productos')
        .update({ facturado: true })
        .in('id', productIds);

      if (updateError) throw updateError;

      // Verificar cada orden y marcar como facturada si todos sus productos están facturados
      for (const orden of ordenesParaFacturar) {
        const { data: productosRestantes } = await supabase
          .from('orden_productos')
          .select('id')
          .eq('orden_id', orden.id)
          .eq('facturado', false);

        if (!productosRestantes || productosRestantes.length === 0) {
          await supabase
            .from('ordenes')
            .update({ estado: 'facturada' })
            .eq('id', orden.id);
        }
      }

      return factura;
    },
    onSuccess: async (factura) => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-domicilio-facturacion'] });
      
      toast.success(`Factura #${factura.consecutivo} generada`, {
        description: `${localSeleccionado} - ${formatCOP(factura.total)}`
      });

      // Generar e imprimir PDF
      try {
        const { data, error } = await supabase.functions.invoke('generar-factura-pdf', {
          body: { facturaId: factura.id, enviarCorreo: false },
        });
        
        if (!error && data?.html) {
          const ventana = window.open('', '_blank');
          if (ventana) {
            ventana.document.write(data.html);
            ventana.document.close();
            setTimeout(() => ventana.print(), 500);
          }
        }
      } catch (e) {
        console.error('Error al generar PDF:', e);
      }

      // Resetear estado
      setDialogOpen(false);
      setOrdenesSeleccionadas([]);
      setLocalSeleccionado(null);
      setMetodoPago("efectivo");
      setReferenciaPago("");
    },
    onError: (error: any) => {
      console.error('Error al facturar:', error);
      toast.error(error.message || "Error al generar la factura consolidada");
    },
  });

  if (authLoading || rolesLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const canAccess = roles?.includes('mesero_externo') || roles?.includes('cajero') || roles?.includes('admin_total') || roles?.includes('admin_sede');
  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  const handleSeleccionarLocal = (nombreLocal: string) => {
    setLocalSeleccionado(nombreLocal);
    setOrdenesSeleccionadas([]);
  };

  const handleToggleOrden = (ordenId: string) => {
    setOrdenesSeleccionadas(prev => 
      prev.includes(ordenId) 
        ? prev.filter(id => id !== ordenId)
        : [...prev, ordenId]
    );
  };

  const handleSeleccionarTodas = () => {
    if (ordenesSeleccionadas.length === ordenesLocalSeleccionado.length) {
      setOrdenesSeleccionadas([]);
    } else {
      setOrdenesSeleccionadas(ordenesLocalSeleccionado.map(o => o.id));
    }
  };

  const handleFacturar = () => {
    if (ordenesSeleccionadas.length === 0) {
      toast.error("Selecciona al menos una orden");
      return;
    }
    setDialogOpen(true);
  };

  const handleConfirmarFactura = async () => {
    setProcesando(true);
    try {
      await facturarMutation.mutateAsync();
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Facturación por Local</h1>
              <p className="text-sm text-muted-foreground">Factura consolidada para oficinas y locales</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!localSeleccionado ? (
          // Vista de selección de local
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Buscar Local u Oficina
                </CardTitle>
                <CardDescription>
                  Ingresa el nombre del local u oficina para ver sus pedidos del día
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Ej: Puerto Rico Local 233..."
                    value={busquedaLocal}
                    onChange={(e) => setBusquedaLocal(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {ordenesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando pedidos...</div>
            ) : localesFiltrados.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay pedidos pendientes de facturar hoy</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {localesFiltrados.map(nombreLocal => {
                  const ordenes = ordenesPorLocal[nombreLocal];
                  const totalPendiente = ordenes.reduce((sum, orden) => {
                    const productosPendientes = orden.orden_productos?.filter((p: any) => !p.facturado) || [];
                    return sum + productosPendientes.reduce((s: number, p: any) => s + p.subtotal, 0);
                  }, 0);

                  return (
                    <Card 
                      key={nombreLocal}
                      className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                      onClick={() => handleSeleccionarLocal(nombreLocal)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <MapPin className="w-5 h-5 text-primary" />
                          {nombreLocal}
                        </CardTitle>
                        <CardDescription>
                          {ordenes.length} pedido{ordenes.length !== 1 ? 's' : ''} pendiente{ordenes.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total a facturar:</span>
                          <span className="font-bold text-lg text-primary">{formatCOP(totalPendiente)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // Vista de órdenes del local seleccionado
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setLocalSeleccionado(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {localSeleccionado}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Pedidos de hoy: {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                </div>
              </div>
              
              {ordenesSeleccionadas.length > 0 && (
                <Button onClick={handleFacturar} className="gap-2">
                  <FileText className="w-4 h-4" />
                  Facturar {ordenesSeleccionadas.length} pedido{ordenesSeleccionadas.length !== 1 ? 's' : ''}
                  <Badge variant="secondary" className="ml-2">
                    {formatCOP(totalesSeleccionados.subtotal)}
                  </Badge>
                </Button>
              )}
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pedidos Pendientes</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSeleccionarTodas}
                  >
                    {ordenesSeleccionadas.length === ordenesLocalSeleccionado.length 
                      ? "Deseleccionar todas" 
                      : "Seleccionar todas"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Orden</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordenesLocalSeleccionado.map(orden => {
                      const productosPendientes = orden.orden_productos?.filter((p: any) => !p.facturado) || [];
                      const totalOrden = productosPendientes.reduce((sum: number, p: any) => sum + p.subtotal, 0);
                      const isSelected = ordenesSeleccionadas.includes(orden.id);

                      return (
                        <TableRow 
                          key={orden.id}
                          className={isSelected ? "bg-primary/5" : ""}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleOrden(orden.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                {orden.numero_orden}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(orden.created_at), "HH:mm")}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {productosPendientes.map((p: any) => (
                                <div key={p.id} className="text-sm">
                                  <span className="font-medium">{p.cantidad}x</span>{" "}
                                  {p.productos?.nombre}
                                  {p.notas && (
                                    <span className="text-muted-foreground ml-1">({p.notas})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCOP(totalOrden)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {ordenesSeleccionadas.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {totalesSeleccionados.cantidadOrdenes} pedido{totalesSeleccionados.cantidadOrdenes !== 1 ? 's' : ''} • {totalesSeleccionados.cantidadProductos} producto{totalesSeleccionados.cantidadProductos !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total a facturar</p>
                        <p className="text-2xl font-bold text-primary">{formatCOP(totalesSeleccionados.subtotal)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog de confirmación de factura */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Confirmar Factura Consolidada
            </DialogTitle>
            <DialogDescription>
              Factura para {localSeleccionado}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pedidos incluidos:</span>
                  <span className="font-medium">{totalesSeleccionados.cantidadOrdenes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total productos:</span>
                  <span className="font-medium">{totalesSeleccionados.cantidadProductos}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary">{formatCOP(totalesSeleccionados.subtotal)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Método de Pago</Label>
              <RadioGroup 
                value={metodoPago} 
                onValueChange={(v) => setMetodoPago(v as any)}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="efectivo" id="efectivo" />
                  <Label htmlFor="efectivo" className="flex items-center gap-2 cursor-pointer">
                    <Banknote className="w-4 h-4" />
                    Efectivo
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="debito" id="debito" />
                  <Label htmlFor="debito" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="w-4 h-4" />
                    Débito
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="credito" id="credito" />
                  <Label htmlFor="credito" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="w-4 h-4" />
                    Crédito
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="nequi" id="nequi" />
                  <Label htmlFor="nequi" className="flex items-center gap-2 cursor-pointer">
                    <Wallet className="w-4 h-4" />
                    Nequi
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 col-span-2">
                  <RadioGroupItem value="daviplata" id="daviplata" />
                  <Label htmlFor="daviplata" className="flex items-center gap-2 cursor-pointer">
                    <Wallet className="w-4 h-4" />
                    Daviplata
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {(metodoPago === "nequi" || metodoPago === "daviplata") && (
              <div className="space-y-2">
                <Label>Número de referencia</Label>
                <Input
                  placeholder="Ej: 12345..."
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={procesando}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarFactura} disabled={procesando} className="gap-2">
              <Printer className="w-4 h-4" />
              {procesando ? "Procesando..." : "Generar Factura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
