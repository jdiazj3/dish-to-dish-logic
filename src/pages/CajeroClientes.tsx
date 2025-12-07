import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Users, Search, Mail, Phone, CreditCard, FileText, TrendingUp, Download, Star, Gift } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CanjePuntos } from "@/components/cajero/CanjePuntos";
import { useQueryClient } from "@tanstack/react-query";

export default function CajeroClientes() {
  const { user } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Query para obtener todos los clientes
  const { data: clientes, isLoading: clientesLoading } = useQuery({
    queryKey: ['clientes-frecuentes', busqueda],
    queryFn: async () => {
      let query = supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (busqueda.trim()) {
        query = query.or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,cedula.ilike.%${busqueda}%,celular.ilike.%${busqueda}%,correo.ilike.%${busqueda}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Query para estadísticas de un cliente específico
  const { data: estadisticasCliente, isLoading: estadisticasLoading } = useQuery({
    queryKey: ['estadisticas-cliente', clienteSeleccionado?.id],
    queryFn: async () => {
      if (!clienteSeleccionado?.id) return null;

      // Obtener facturas
      const { data: facturas, error } = await supabase
        .from('facturas')
        .select(`
          id,
          consecutivo,
          total,
          metodo_pago,
          created_at,
          factura_items(producto_nombre, cantidad, subtotal)
        `)
        .eq('cliente_id', clienteSeleccionado.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener puntos ganados
      const { data: puntosData, error: puntosError } = await supabase
        .from('puntos_cliente')
        .select('puntos_otorgados, turno, factura_id')
        .eq('cliente_id', clienteSeleccionado.id);

      if (puntosError) throw puntosError;

      // Obtener puntos usados en canjes
      const { data: canjesData } = await supabase
        .from('canjes_puntos')
        .select('puntos_usados')
        .eq('cliente_id', clienteSeleccionado.id)
        .neq('estado', 'cancelado');

      const puntosGanados = puntosData?.reduce((sum, p) => sum + p.puntos_otorgados, 0) || 0;
      const puntosUsados = canjesData?.reduce((sum, c) => sum + c.puntos_usados, 0) || 0;
      const totalPuntos = puntosGanados - puntosUsados;
      
      // Crear mapa de puntos por factura
      const puntosPorFactura: { [key: string]: number } = {};
      puntosData?.forEach(p => {
        puntosPorFactura[p.factura_id] = p.puntos_otorgados;
      });

      const totalGastado = facturas?.reduce((sum, f) => sum + parseFloat(String(f.total)), 0) || 0;
      const totalVisitas = facturas?.length || 0;
      
      // Calcular productos favoritos
      const productosCount: { [key: string]: number } = {};
      facturas?.forEach(factura => {
        factura.factura_items?.forEach((item: any) => {
          productosCount[item.producto_nombre] = (productosCount[item.producto_nombre] || 0) + item.cantidad;
        });
      });
      
      const productosFavoritos = Object.entries(productosCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }));

      return {
        totalGastado,
        totalVisitas,
        ticketPromedio: totalVisitas > 0 ? totalGastado / totalVisitas : 0,
        productosFavoritos,
        facturas: facturas || [],
        totalPuntos,
        puntosPorFactura,
      };
    },
    enabled: !!clienteSeleccionado?.id,
  });

  // Esperar a que terminen de cargar los roles
  if (isLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  const isCajeroOrAdmin = roles.includes('cajero') || roles.includes('admin_total') || roles.includes('admin_sede');
  
  if (!isCajeroOrAdmin) {
    return <Navigate to="/" replace />;
  }

  const isAdmin = roles?.includes('admin_total') || roles?.includes('admin_sede');

  const handleVerCliente = (cliente: any) => {
    setClienteSeleccionado(cliente);
    setDialogOpen(true);
  };

  const exportarExcel = async () => {
    if (!clientes || clientes.length === 0) {
      toast.error("No hay clientes para exportar");
      return;
    }

    toast.loading("Generando reporte...", { id: "export" });

    try {
      // Obtener estadísticas de todos los clientes
      const clientesConEstadisticas = await Promise.all(
        clientes.map(async (cliente) => {
          const { data: facturas } = await supabase
            .from('facturas')
            .select('total')
            .eq('cliente_id', cliente.id);

          const totalGastado = facturas?.reduce((sum, f) => sum + parseFloat(String(f.total)), 0) || 0;
          const totalVisitas = facturas?.length || 0;

          return {
            Nombre: cliente.nombre || '',
            Apellido: cliente.apellido || '',
            Cédula: cliente.cedula || '',
            Celular: cliente.celular || '',
            Correo: cliente.correo || '',
            'Fecha Registro': format(new Date(cliente.created_at), 'dd/MM/yyyy'),
            'Total Gastado': totalGastado,
            'Número de Visitas': totalVisitas,
            'Ticket Promedio': totalVisitas > 0 ? Math.round(totalGastado / totalVisitas) : 0,
          };
        })
      );

      // Native CSV export (no xlsx library)
      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n') 
          ? `"${str.replace(/"/g, '""')}"` : str;
      };
      
      const headers = Object.keys(clientesConEstadisticas[0]);
      const csv = [
        headers.map(escapeCSV).join(','),
        ...clientesConEstadisticas.map(row => headers.map(h => escapeCSV(row[h as keyof typeof row])).join(','))
      ].join('\n');
      
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `clientes_frecuentes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      toast.success("Reporte exportado exitosamente", { id: "export" });
    } catch (error) {
      console.error("Error al exportar:", error);
      toast.error("Error al generar el reporte", { id: "export" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/cajero')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Clientes Frecuentes</h1>
              <p className="text-sm text-muted-foreground">Base de datos de clientes registrados</p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={exportarExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Barra de búsqueda */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Buscar Cliente
            </CardTitle>
            <CardDescription>Busca por nombre, apellido, cédula, teléfono o correo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Escriba para buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="max-w-md"
              />
              {busqueda && (
                <Button variant="ghost" onClick={() => setBusqueda("")}>
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabla de clientes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Listado de Clientes</CardTitle>
                <CardDescription>
                  {clientes?.length || 0} cliente{(clientes?.length || 0) !== 1 ? 's' : ''} encontrado{(clientes?.length || 0) !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                <Users className="w-3 h-3 mr-1" />
                {clientes?.length || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {clientesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando clientes...</div>
            ) : clientes && clientes.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cédula</TableHead>
                      <TableHead>Celular</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Registrado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.map((cliente) => (
                      <TableRow key={cliente.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleVerCliente(cliente)}>
                        <TableCell className="font-medium">
                          {cliente.nombre || ''} {cliente.apellido || ''}
                          {!cliente.nombre && !cliente.apellido && <span className="text-muted-foreground">Sin nombre</span>}
                        </TableCell>
                        <TableCell>
                          {cliente.cedula ? (
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-muted-foreground" />
                              {cliente.cedula}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cliente.celular ? (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {cliente.celular}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cliente.correo ? (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-32">{cliente.correo}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(cliente.created_at), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleVerCliente(cliente); }}>
                            Ver Detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {busqueda ? 'No se encontraron clientes con esos criterios' : 'No hay clientes registrados'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de detalle del cliente */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {clienteSeleccionado?.nombre || ''} {clienteSeleccionado?.apellido || 'Cliente'}
            </DialogTitle>
            <DialogDescription>Información y historial de compras del cliente</DialogDescription>
          </DialogHeader>

          {clienteSeleccionado && (
            <div className="space-y-6">
              {/* Datos del cliente */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cédula:</span>
                    <p className="font-medium">{clienteSeleccionado.cedula || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Celular:</span>
                    <p className="font-medium">{clienteSeleccionado.celular || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Correo:</span>
                    <p className="font-medium">{clienteSeleccionado.correo || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Estadísticas */}
              {estadisticasLoading ? (
                <div className="text-center py-4 text-muted-foreground">Cargando estadísticas...</div>
              ) : estadisticasCliente && (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <Card className="bg-primary/5">
                      <CardContent className="pt-4 text-center">
                        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <p className="text-xs text-muted-foreground">Total Gastado</p>
                        <p className="text-lg font-bold">${estadisticasCliente.totalGastado.toLocaleString('es-CO')}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-primary/5">
                      <CardContent className="pt-4 text-center">
                        <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <p className="text-xs text-muted-foreground">Visitas</p>
                        <p className="text-lg font-bold">{estadisticasCliente.totalVisitas}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-primary/5">
                      <CardContent className="pt-4 text-center">
                        <CreditCard className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <p className="text-xs text-muted-foreground">Ticket Promedio</p>
                        <p className="text-lg font-bold">${estadisticasCliente.ticketPromedio.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-500/10 border-yellow-500/30">
                      <CardContent className="pt-4 text-center">
                        <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                        <p className="text-xs text-muted-foreground">Puntos Disponibles</p>
                        <p className="text-lg font-bold text-yellow-600">{estadisticasCliente.totalPuntos}</p>
                        {estadisticasCliente.totalPuntos > 0 && (
                          <div className="mt-2">
                            <CanjePuntos
                              clienteId={clienteSeleccionado.id}
                              clienteNombre={`${clienteSeleccionado.nombre || ''} ${clienteSeleccionado.apellido || ''}`}
                              puntosDisponibles={estadisticasCliente.totalPuntos}
                              onCanjeExitoso={() => queryClient.invalidateQueries({ queryKey: ['estadisticas-cliente', clienteSeleccionado.id] })}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Productos favoritos */}
                  {estadisticasCliente.productosFavoritos.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Productos Favoritos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {estadisticasCliente.productosFavoritos.map((prod: any, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {prod.nombre} ({prod.cantidad}x)
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Historial de facturas */}
                  {estadisticasCliente.facturas.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Historial de Compras</CardTitle>
                        <CardDescription>Últimas {estadisticasCliente.facturas.length} facturas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {estadisticasCliente.facturas.map((factura: any) => {
                            const puntosFactura = estadisticasCliente.puntosPorFactura?.[factura.id] || 0;
                            return (
                              <div key={factura.id} className="p-3 border rounded-lg text-sm">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium">Factura #{factura.consecutivo}</span>
                                  <div className="flex items-center gap-2">
                                    {puntosFactura > 0 && (
                                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                        <Star className="w-3 h-3 mr-1" />
                                        +{puntosFactura}
                                      </Badge>
                                    )}
                                    <Badge variant="outline">${Number(factura.total).toLocaleString('es-CO')}</Badge>
                                  </div>
                                </div>
                                <div className="flex justify-between text-muted-foreground text-xs">
                                  <span>{format(new Date(factura.created_at), 'dd/MM/yyyy HH:mm')}</span>
                                  <span className="capitalize">{factura.metodo_pago}</span>
                                </div>
                                {factura.factura_items?.length > 0 && (
                                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                                    {factura.factura_items.slice(0, 3).map((item: any, idx: number) => (
                                      <div key={idx}>{item.cantidad}x {item.producto_nombre}</div>
                                    ))}
                                    {factura.factura_items.length > 3 && (
                                      <div>+{factura.factura_items.length - 3} más...</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {estadisticasCliente.facturas.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      Este cliente no tiene historial de compras
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}