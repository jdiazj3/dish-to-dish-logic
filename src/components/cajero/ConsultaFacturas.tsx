import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Receipt } from "lucide-react";
import { format } from "date-fns";

export function ConsultaFacturas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFactura, setSelectedFactura] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: facturas, isLoading } = useQuery({
    queryKey: ['facturas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturas')
        .select(`
          *,
          ordenes(mesas(numero, salones(nombre)))
        `)
        .order('consecutivo', { ascending: false });
      
      if (error) throw error;
      
      // Obtener información de los cajeros
      const cajeroIds = Array.from(new Set(data?.map(f => f.cajero_id).filter(Boolean)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, apellido')
        .in('id', cajeroIds);
      
      const profilesMap = new Map(profiles?.map(p => [p.id, p]));
      
      return data?.map(factura => ({
        ...factura,
        cajero: factura.cajero_id ? profilesMap.get(factura.cajero_id) : null
      }));
    },
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
            <p className="text-muted-foreground">Cargando...</p>
          ) : facturasFiltradas && facturasFiltradas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consecutivo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Cajero</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturasFiltradas.map((factura) => (
                  <TableRow key={factura.id}>
                    <TableCell>
                      <Badge variant="outline">#{factura.consecutivo}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{factura.nombre_cliente}</TableCell>
                    <TableCell>Mesa {factura.ordenes?.mesas?.numero}</TableCell>
                    <TableCell>
                      {factura.cajero ? `${factura.cajero.nombre} ${factura.cajero.apellido}` : 'N/A'}
                    </TableCell>
                    <TableCell>{format(new Date(factura.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="font-semibold">
                      ${Number(factura.total).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleVerDetalle(factura)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
                          ${Number(item.precio_unitario).toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell className="text-right">
                          ${Number(item.subtotal).toLocaleString('es-CO')}
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
                    ${Number(selectedFactura.subtotal).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impuestos:</span>
                  <span className="font-medium">
                    ${Number(selectedFactura.impuestos).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Propina:</span>
                  <span className="font-medium">
                    ${Number(selectedFactura.propina || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>
                    ${Number(selectedFactura.total).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
