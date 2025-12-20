import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Receipt, Download, Mail } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatCOP } from "@/utils/formatCurrency";

export function ConsultaFacturas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFactura, setSelectedFactura] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [correoEnvio, setCorreoEnvio] = useState("");
  const [dialogEnvio, setDialogEnvio] = useState(false);

  const { data: facturas, isLoading, error } = useQuery({
    queryKey: ['facturas'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('facturas')
          .select(`
            *,
            ordenes(mesas(numero, salones(nombre)))
          `)
          .order('consecutivo', { ascending: false });
        
        if (error) {
          console.error('Error al cargar facturas:', error);
          throw error;
        }
        
        // Obtener información de los cajeros
        const cajeroIds = Array.from(new Set(data?.map(f => f.cajero_id).filter(Boolean)));
        
        if (cajeroIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, nombre, apellido')
            .in('id', cajeroIds);
          
          if (profilesError) {
            console.error('Error al cargar perfiles:', profilesError);
          }
          
          const profilesMap = new Map(profiles?.map(p => [p.id, p]));
          
          return data?.map(factura => ({
            ...factura,
            cajero: factura.cajero_id ? profilesMap.get(factura.cajero_id) : null
          }));
        }
        
        return data?.map(factura => ({ ...factura, cajero: null }));
      } catch (err) {
        console.error('Error en queryFn facturas:', err);
        throw err;
      }
    },
    retry: 1,
  });

  const { data: facturaItems } = useQuery({
    queryKey: ['factura-items', selectedFactura?.id],
    queryFn: async () => {
      if (!selectedFactura) return [];
      
      const { data, error } = await supabase
        .from('factura_items')
        .select('*')
        .eq('factura_id', selectedFactura.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedFactura,
  });

  const handleVerDetalle = (factura: any) => {
    setSelectedFactura(factura);
    setDialogOpen(true);
  };

  const generarPDFMutation = useMutation({
    mutationFn: async ({ facturaId, enviarCorreo, correo }: { facturaId: string; enviarCorreo: boolean; correo?: string }) => {
      const { data, error } = await supabase.functions.invoke('generar-factura-pdf', {
        body: {
          facturaId,
          enviarCorreo,
          correoDestino: correo,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (variables.enviarCorreo) {
        toast.success("Factura enviada por correo exitosamente");
        setDialogEnvio(false);
        setCorreoEnvio("");
      } else {
        // Abrir en nueva ventana para imprimir
        const ventana = window.open('', '_blank');
        if (ventana) {
          ventana.document.write(data.html);
          ventana.document.close();
          setTimeout(() => {
            ventana.print();
          }, 500);
        }
        toast.success("Factura lista para imprimir");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al procesar la factura");
    },
  });

  const handleDescargarPDF = () => {
    if (selectedFactura) {
      generarPDFMutation.mutate({
        facturaId: selectedFactura.id,
        enviarCorreo: false,
      });
    }
  };

  const handleEnviarCorreo = () => {
    if (!correoEnvio) {
      toast.error("Ingresa un correo electrónico");
      return;
    }

    if (selectedFactura) {
      generarPDFMutation.mutate({
        facturaId: selectedFactura.id,
        enviarCorreo: true,
        correo: correoEnvio,
      });
    }
  };

  const facturasFiltradas = facturas?.filter(factura => 
    factura.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    factura.consecutivo.toString().includes(searchTerm)
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Consulta de Facturas
              </CardTitle>
              <CardDescription>Historial de facturas emitidas</CardDescription>
            </div>
            <div className="w-64">
              <Label htmlFor="search" className="sr-only">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Buscar por cliente o #factura..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando facturas...</p>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">Error al cargar las facturas</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          ) : facturasFiltradas && facturasFiltradas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consecutivo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Cajero</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturasFiltradas.map((factura) => {
                  const metodosLabels: Record<string, string> = {
                    efectivo: 'Efectivo',
                    debito: 'Débito',
                    credito: 'Crédito',
                    nequi: 'Nequi',
                    daviplata: 'Daviplata',
                  };
                  return (
                  <TableRow key={factura.id}>
                    <TableCell>
                      <Badge variant="outline">#{factura.consecutivo}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{factura.nombre_cliente}</TableCell>
                    <TableCell>Mesa {factura.ordenes?.mesas?.numero}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {metodosLabels[factura.metodo_pago] || 'Efectivo'}
                        {factura.referencia_pago && (
                          <p className="text-xs text-muted-foreground">Ref: {factura.referencia_pago}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {factura.cajero ? `${factura.cajero.nombre} ${factura.cajero.apellido}` : 'N/A'}
                    </TableCell>
                    <TableCell>{format(new Date(factura.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCOP(factura.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleVerDetalle(factura)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalle
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedFactura(factura);
                            generarPDFMutation.mutate({
                              facturaId: factura.id,
                              enviarCorreo: false,
                            });
                          }}
                          disabled={generarPDFMutation.isPending}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Imprimir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedFactura(factura);
                            setDialogEnvio(true);
                          }}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? "No se encontraron facturas" : "No hay facturas registradas"}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Factura #{selectedFactura?.consecutivo}</DialogTitle>
          </DialogHeader>

          {selectedFactura && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedFactura.nombre_cliente}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mesa</p>
                  <p className="font-medium">
                    Mesa {selectedFactura.ordenes?.mesas?.numero} - {selectedFactura.ordenes?.mesas?.salones?.nombre}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cajero</p>
                  <p className="font-medium">
                    {selectedFactura.cajero ? `${selectedFactura.cajero.nombre} ${selectedFactura.cajero.apellido}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {format(new Date(selectedFactura.created_at), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Método de Pago</p>
                  <p className="font-medium">
                    {{efectivo: 'Efectivo', debito: 'Tarjeta Débito', credito: 'Tarjeta Crédito', nequi: 'Nequi', daviplata: 'Daviplata'}[selectedFactura.metodo_pago] || 'Efectivo'}
                  </p>
                </div>
                {selectedFactura.referencia_pago && (
                  <div>
                    <p className="text-muted-foreground">Referencia de Pago</p>
                    <p className="font-medium">{selectedFactura.referencia_pago}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-3">Productos</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturaItems?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.producto_nombre}</TableCell>
                        <TableCell className="text-center">{item.cantidad}</TableCell>
                        <TableCell className="text-right">
                          {formatCOP(item.precio_unitario)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCOP(item.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {formatCOP(selectedFactura.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impuestos:</span>
                  <span className="font-medium">
                    {formatCOP(selectedFactura.impuestos)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Propina:</span>
                  <span className="font-medium">
                    {formatCOP(selectedFactura.propina || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>
                    {formatCOP(selectedFactura.total)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogEnvio} onOpenChange={setDialogEnvio}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Factura por Correo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                placeholder="cliente@ejemplo.com"
                value={correoEnvio}
                onChange={(e) => setCorreoEnvio(e.target.value)}
              />
            </div>
            {selectedFactura && (
              <div className="text-sm text-muted-foreground">
                <p>Factura: #{selectedFactura.consecutivo}</p>
                <p>Total: {formatCOP(selectedFactura.total)}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogEnvio(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEnviarCorreo}
              disabled={generarPDFMutation.isPending}
            >
              <Mail className="w-4 h-4 mr-2" />
              {generarPDFMutation.isPending ? "Enviando..." : "Enviar Factura"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
