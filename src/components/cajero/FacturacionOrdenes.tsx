import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, DollarSign, Users, CreditCard, Banknote, Wallet, Printer, ChevronDown, User, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ClienteData {
  nombre: string;
  apellido: string;
  cedula: string;
  celular: string;
  correo: string;
}

export function FacturacionOrdenes() {
  const { user } = useAuth();
  const [selectedOrden, setSelectedOrden] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoFacturacion, setTipoFacturacion] = useState<"completa" | "silla">("completa");
  const [sillasSeleccionadas, setSillasSeleccionadas] = useState<number[]>([]);
  const [propinaPorcentaje, setPropinaPorcentaje] = useState(10);
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "debito" | "credito" | "nequi" | "daviplata">("efectivo");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [facturaGenerada, setFacturaGenerada] = useState<any>(null);
  const [clienteData, setClienteData] = useState<ClienteData>({ nombre: "", apellido: "", cedula: "", celular: "", correo: "" });
  const [clienteExpanded, setClienteExpanded] = useState(false);
  const [busquedaCedula, setBusquedaCedula] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<any>(null);
  const [sillasFacturadasSesion, setSillasFacturadasSesion] = useState<number[]>([]);
  const [historialExpanded, setHistorialExpanded] = useState(false);
  const queryClient = useQueryClient();

  // Query para historial de compras del cliente encontrado
  const { data: historialCompras, isLoading: historialLoading } = useQuery({
    queryKey: ['historial-cliente', clienteEncontrado?.id],
    queryFn: async () => {
      if (!clienteEncontrado?.id) return { facturas: [], totalPuntos: 0 };
      
      const { data, error } = await supabase
        .from('facturas')
        .select(`
          id,
          consecutivo,
          total,
          metodo_pago,
          created_at,
          factura_items(producto_nombre, cantidad, subtotal)
        `)
        .eq('cliente_id', clienteEncontrado.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;

      // Obtener puntos del cliente
      const { data: puntosData } = await supabase
        .from('puntos_cliente')
        .select('puntos_otorgados, factura_id')
        .eq('cliente_id', clienteEncontrado.id);

      const totalPuntos = puntosData?.reduce((sum, p) => sum + p.puntos_otorgados, 0) || 0;
      
      // Mapa de puntos por factura
      const puntosPorFactura: { [key: string]: number } = {};
      puntosData?.forEach(p => {
        puntosPorFactura[p.factura_id] = p.puntos_otorgados;
      });

      return { 
        facturas: data || [], 
        totalPuntos,
        puntosPorFactura
      };
    },
    enabled: !!clienteEncontrado?.id,
  });

  // Query para configuración de puntos
  const { data: puntosConfig } = useQuery({
    queryKey: ['puntos-configuracion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('puntos_configuracion')
        .select('*')
        .eq('activo', true);
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: ordenesEntregadas, isLoading, error } = useQuery({
    queryKey: ['ordenes-entregadas'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('ordenes')
          .select(`
            *,
            numero_orden,
            mesas(numero, salones(nombre)),
            orden_productos(*, productos(nombre))
          `)
          .eq('estado', 'entregada')
          .order('numero_orden', { ascending: false });
        
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

  // Función para reproducir sonido de notificación
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('No se pudo reproducir sonido');
    }
  };

  // Suscripción en tiempo real para órdenes
  useEffect(() => {
    const channel = supabase
      .channel('ordenes-cajero')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ordenes',
          filter: 'estado=eq.entregada',
        },
        () => {
          playNotificationSound();
          toast.info("Nueva orden entregada", { description: "Hay una nueva orden lista para facturar" });
          queryClient.invalidateQueries({ queryKey: ['ordenes-entregadas'] });
        }
      )
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
    mutationFn: async ({ ordenId, items, totales, metodoPago, referenciaPago, sillasFacturadas, clienteId, turnoOrden }: any) => {
      // Crear la factura
      const { data: factura, error: facturaError } = await supabase
        .from('facturas')
        .insert({
          orden_id: ordenId,
          cajero_id: user?.id,
          nombre_cliente: clienteData.nombre && clienteData.apellido 
            ? `${clienteData.nombre} ${clienteData.apellido}` 
            : selectedOrden.nombre_cliente || 'Cliente',
          subtotal: totales.subtotal,
          impuestos: totales.impuestos,
          propina: totales.propina,
          total: totales.total,
          metodo_pago: metodoPago,
          referencia_pago: referenciaPago || null,
          cliente_id: clienteId || null,
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

      // Calcular y asignar puntos si hay cliente registrado
      let puntosOtorgados = 0;
      if (clienteId && puntosConfig && puntosConfig.length > 0) {
        const configTurno = puntosConfig.find((c: any) => c.turno === turnoOrden);
        if (configTurno) {
          puntosOtorgados = Math.floor((totales.total / configTurno.monto_base) * configTurno.puntos_por_peso);
          
          if (puntosOtorgados > 0) {
            const { error: puntosError } = await supabase
              .from('puntos_cliente')
              .insert({
                cliente_id: clienteId,
                factura_id: factura.id,
                puntos_otorgados: puntosOtorgados,
                turno: turnoOrden,
                monto_factura: totales.total,
              });
            
            if (puntosError) {
              console.error('Error al asignar puntos:', puntosError);
            }
          }
        }
      }

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
        .select('id, numero_silla')
        .eq('orden_id', ordenId)
        .eq('facturado', false);

      // Si no quedan productos sin facturar, marcar la orden como facturada
      const ordenCompleta = !productosRestantes || productosRestantes.length === 0;
      if (ordenCompleta) {
        await supabase
          .from('ordenes')
          .update({ estado: 'facturada' })
          .eq('id', ordenId);
      }

      return { 
        factura, 
        ordenCompleta, 
        sillasRestantes: productosRestantes?.map((p: any) => p.numero_silla) || [],
        sillasFacturadas,
        puntosOtorgados
      };
    },
    onSuccess: async (result) => {
      const { factura, ordenCompleta, sillasFacturadas, puntosOtorgados } = result;
      
      queryClient.invalidateQueries({ queryKey: ['ordenes-entregadas'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-pendientes-facturar'] });
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      
      // Mostrar toast de éxito con puntos si aplica
      const sillasTexto = sillasFacturadas?.length > 0 
        ? `Silla${sillasFacturadas.length > 1 ? 's' : ''} ${sillasFacturadas.join(', ')}` 
        : 'Mesa completa';
      const puntosTexto = puntosOtorgados > 0 ? ` | +${puntosOtorgados} puntos` : '';
      toast.success(`Factura #${factura.consecutivo} generada`, {
        description: `${sillasTexto} - $${Number(factura.total).toLocaleString('es-CO')}${puntosTexto}`
      });
      
      // Generar e imprimir PDF automáticamente
      setFacturaGenerada(factura);
      imprimirPDFMutation.mutate(factura.id);
      
      // Si la orden está completa, cerrar todo
      if (ordenCompleta) {
        setDialogOpen(false);
        resetForm();
      } else {
        // Si quedan sillas pendientes, actualizar la orden seleccionada y resetear selección de sillas
        // Guardar las sillas facturadas en la sesión para mostrarlas visualmente
        if (sillasFacturadas && sillasFacturadas.length > 0) {
          setSillasFacturadasSesion(prev => [...prev, ...sillasFacturadas]);
        }
        setSillasSeleccionadas([]);
        // Limpiar datos del cliente para permitir ingresar uno nuevo por cada silla
        setClienteData({ nombre: "", apellido: "", cedula: "", celular: "", correo: "" });
        setBusquedaCedula("");
        setClienteEncontrado(null);
        // Refrescar la orden seleccionada con los datos actualizados
        const { data: ordenActualizada } = await supabase
          .from('ordenes')
          .select(`
            *,
            mesas(numero, salones(nombre)),
            orden_productos(*, productos(nombre))
          `)
          .eq('id', selectedOrden.id)
          .maybeSingle();
        
        if (ordenActualizada) {
          setSelectedOrden(ordenActualizada);
        }
      }
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
    setMetodoPago("efectivo");
    setReferenciaPago("");
    setClienteData({ nombre: "", apellido: "", cedula: "", celular: "", correo: "" });
    setClienteExpanded(false);
    setBusquedaCedula("");
    setClienteEncontrado(null);
    setSillasFacturadasSesion([]);
    setHistorialExpanded(false);
  };

  const buscarClientePorCedula = async () => {
    if (!busquedaCedula.trim()) return;
    
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('cedula', busquedaCedula.trim())
      .maybeSingle();
    
    if (error) {
      toast.error("Error al buscar cliente");
      return;
    }
    
    if (data) {
      setClienteEncontrado(data);
      setClienteData({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        cedula: data.cedula || "",
        celular: data.celular || "",
        correo: data.correo || "",
      });
      toast.success("Cliente encontrado");
    } else {
      setClienteEncontrado(null);
      toast.info("Cliente no registrado");
    }
  };

  const guardarCliente = async (): Promise<string | null> => {
    // Si no hay datos del cliente, no guardar
    const tieneAlgunDato = clienteData.nombre || clienteData.apellido || clienteData.cedula || clienteData.celular || clienteData.correo;
    if (!tieneAlgunDato) return null;
    
    // Si ya tenemos un cliente encontrado con la misma cédula, usarlo
    if (clienteEncontrado && clienteEncontrado.cedula === clienteData.cedula) {
      return clienteEncontrado.id;
    }
    
    // Si tiene cédula, verificar si ya existe
    if (clienteData.cedula) {
      const { data: existente } = await supabase
        .from('clientes')
        .select('id')
        .eq('cedula', clienteData.cedula)
        .maybeSingle();
      
      if (existente) {
        // Actualizar cliente existente
        await supabase
          .from('clientes')
          .update({
            nombre: clienteData.nombre || null,
            apellido: clienteData.apellido || null,
            celular: clienteData.celular || null,
            correo: clienteData.correo || null,
          })
          .eq('id', existente.id);
        return existente.id;
      }
    }
    
    // Crear nuevo cliente
    const { data: nuevoCliente, error } = await supabase
      .from('clientes')
      .insert({
        nombre: clienteData.nombre || null,
        apellido: clienteData.apellido || null,
        cedula: clienteData.cedula || null,
        celular: clienteData.celular || null,
        correo: clienteData.correo || null,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error al guardar cliente:', error);
      return null;
    }
    
    return nuevoCliente?.id || null;
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

  const confirmarFacturacion = async () => {
    const totales = calcularTotales();
    
    if (tipoFacturacion === "silla" && sillasSeleccionadas.length === 0) {
      toast.error("Selecciona al menos una silla");
      return;
    }

    // Guardar cliente si hay datos
    const clienteId = await guardarCliente();

    facturarMutation.mutate({
      ordenId: selectedOrden.id,
      items: totales.items,
      totales: {
        subtotal: totales.subtotal,
        impuestos: totales.impuestos,
        propina: totales.propina,
        total: totales.total,
      },
      metodoPago,
      referenciaPago: referenciaPago.trim(),
      sillasFacturadas: tipoFacturacion === "silla" ? sillasSeleccionadas : null,
      clienteId,
      turnoOrden: selectedOrden.turno,
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Órdenes Pendientes de Facturar
              </CardTitle>
              <CardDescription>Órdenes entregadas con productos sin facturar</CardDescription>
            </div>
            {facturaGenerada && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => imprimirPDFMutation.mutate(facturaGenerada.id)}
                disabled={imprimirPDFMutation.isPending}
              >
                <Printer className="w-4 h-4 mr-2" />
                {imprimirPDFMutation.isPending ? "Generando..." : `Reimprimir #${facturaGenerada.consecutivo}`}
              </Button>
            )}
          </div>
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
                  <TableHead>Orden</TableHead>
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
                      <TableCell>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                          {orden.numero_orden || '-'}
                        </div>
                      </TableCell>
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
            <DialogTitle className="flex items-center gap-3">
              {selectedOrden?.numero_orden && (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                  {selectedOrden.numero_orden}
                </div>
              )}
              Facturar Orden - Mesa {selectedOrden?.mesas?.numero}
            </DialogTitle>
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

            {/* Datos del cliente frecuente */}
            <Collapsible open={clienteExpanded} onOpenChange={setClienteExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Datos del Cliente (Opcional)
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${clienteExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-4">
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  {/* Búsqueda por cédula */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="buscar-cedula" className="text-xs text-muted-foreground">Buscar cliente por cédula</Label>
                      <Input
                        id="buscar-cedula"
                        placeholder="Ingrese cédula para buscar..."
                        value={busquedaCedula}
                        onChange={(e) => setBusquedaCedula(e.target.value.replace(/\D/g, ''))}
                        maxLength={15}
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="mt-5"
                      onClick={buscarClientePorCedula}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>

                  {clienteEncontrado && (
                    <div className="space-y-2">
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
                        ✓ Cliente registrado: {clienteEncontrado.nombre} {clienteEncontrado.apellido}
                      </div>
                      
                      {/* Puntos acumulados del cliente */}
                      {historialCompras && historialCompras.totalPuntos > 0 && (
                        <div className="flex items-center gap-2 text-sm bg-yellow-50 p-2 rounded border border-yellow-200">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-yellow-700 font-medium">
                            {historialCompras.totalPuntos} puntos acumulados
                          </span>
                        </div>
                      )}
                      
                      {/* Historial de compras del cliente */}
                      {historialCompras && historialCompras.facturas.length > 0 && (
                        <Collapsible open={historialExpanded} onOpenChange={setHistorialExpanded}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-8 bg-muted/50">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Historial de compras ({historialCompras.facturas.length} facturas)
                              </span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${historialExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2">
                            <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2 bg-muted/30">
                              {historialCompras.facturas.map((factura: any) => {
                                const puntosFactura = historialCompras.puntosPorFactura?.[factura.id] || 0;
                                return (
                                  <div key={factura.id} className="text-xs p-2 bg-background rounded border">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-medium">Factura #{factura.consecutivo}</span>
                                      <div className="flex items-center gap-1">
                                        {puntosFactura > 0 && (
                                          <Badge variant="outline" className="text-[10px] h-5 bg-yellow-50 text-yellow-700 border-yellow-200">
                                            <Star className="w-2 h-2 mr-0.5" />
                                            +{puntosFactura}
                                          </Badge>
                                        )}
                                        <Badge variant="outline" className="text-[10px] h-5">
                                          ${Number(factura.total).toLocaleString('es-CO')}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                      <span>{format(new Date(factura.created_at), 'dd/MM/yyyy HH:mm')}</span>
                                      <span className="capitalize">{factura.metodo_pago}</span>
                                    </div>
                                    {factura.factura_items?.length > 0 && (
                                      <div className="mt-1 pt-1 border-t text-muted-foreground">
                                        {factura.factura_items.slice(0, 3).map((item: any, idx: number) => (
                                          <div key={idx} className="truncate">
                                            {item.cantidad}x {item.producto_nombre}
                                          </div>
                                        ))}
                                        {factura.factura_items.length > 3 && (
                                          <div className="text-muted-foreground/70">
                                            +{factura.factura_items.length - 3} más...
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                      
                      {historialLoading && (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          Cargando historial...
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="cliente-nombre" className="text-xs">Nombre</Label>
                      <Input
                        id="cliente-nombre"
                        placeholder="Nombre"
                        value={clienteData.nombre}
                        onChange={(e) => setClienteData({ ...clienteData, nombre: e.target.value })}
                        maxLength={50}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cliente-apellido" className="text-xs">Apellido</Label>
                      <Input
                        id="cliente-apellido"
                        placeholder="Apellido"
                        value={clienteData.apellido}
                        onChange={(e) => setClienteData({ ...clienteData, apellido: e.target.value })}
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cliente-cedula" className="text-xs">Cédula</Label>
                    <Input
                      id="cliente-cedula"
                      placeholder="Número de cédula"
                      value={clienteData.cedula}
                      onChange={(e) => setClienteData({ ...clienteData, cedula: e.target.value.replace(/\D/g, '') })}
                      maxLength={15}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="cliente-celular" className="text-xs">Celular</Label>
                      <Input
                        id="cliente-celular"
                        placeholder="Número de celular"
                        value={clienteData.celular}
                        onChange={(e) => setClienteData({ ...clienteData, celular: e.target.value.replace(/\D/g, '') })}
                        maxLength={15}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cliente-correo" className="text-xs">Correo</Label>
                      <Input
                        id="cliente-correo"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={clienteData.correo}
                        onChange={(e) => setClienteData({ ...clienteData, correo: e.target.value })}
                        maxLength={100}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {tipoFacturacion === "silla" && (
              <div className="space-y-3">
                <Label>Seleccionar Sillas a Facturar</Label>
                
                {/* Mostrar sillas ya facturadas en esta sesión */}
                {sillasFacturadasSesion.length > 0 && (
                  <div className="space-y-2 opacity-60">
                    <p className="text-xs text-muted-foreground font-medium">Sillas ya facturadas:</p>
                    {sillasFacturadasSesion.map((silla: number) => (
                      <div key={`facturada-${silla}`} className="border rounded-lg p-3 bg-muted/50 border-green-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                            <span className="font-semibold line-through text-muted-foreground">
                              Silla {silla}
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Facturada
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Sillas pendientes por facturar */}
                <div className="space-y-3">
                  {sillasDisponibles.length > 0 && sillasFacturadasSesion.length > 0 && (
                    <p className="text-xs text-muted-foreground font-medium">Sillas pendientes:</p>
                  )}
                  {sillasDisponibles.map((silla: number) => {
                    const sillaData = productosPorSilla[silla];
                    return (
                      <div key={silla} className="border rounded-lg p-3 border-primary/30 bg-background">
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

            <div className="space-y-3">
              <Label>Método de Pago</Label>
              <Select value={metodoPago} onValueChange={(value: any) => setMetodoPago(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Efectivo
                    </div>
                  </SelectItem>
                  <SelectItem value="debito">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Tarjeta Débito
                    </div>
                  </SelectItem>
                  <SelectItem value="credito">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Tarjeta Crédito
                    </div>
                  </SelectItem>
                  <SelectItem value="nequi">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Nequi
                    </div>
                  </SelectItem>
                  <SelectItem value="daviplata">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Daviplata
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(metodoPago === "nequi" || metodoPago === "daviplata") && (
              <div className="space-y-3">
                <Label htmlFor="referencia">Número de Referencia / Transferencia</Label>
                <Input
                  id="referencia"
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value.slice(0, 50))}
                  placeholder="Ej: 123456789"
                  maxLength={50}
                />
              </div>
            )}

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
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={facturarMutation.isPending}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmarFacturacion} 
                disabled={
                  facturarMutation.isPending || 
                  (tipoFacturacion === "silla" && sillasSeleccionadas.length === 0) ||
                  (tipoFacturacion === "completa" && sillasDisponibles.length === 0)
                }
              >
                {facturarMutation.isPending ? "Procesando..." : 
                  sillasDisponibles.length === 0 ? "Todo Facturado" : "Generar Factura"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
