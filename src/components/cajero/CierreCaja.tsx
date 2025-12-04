import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, CreditCard, Banknote, Calculator, CheckCircle, Smartphone, Printer } from "lucide-react";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

const printCierreReport = (cierre: any, fecha: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error("No se pudo abrir la ventana de impresión");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cierre de Caja - ${fecha}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header h1 { font-size: 18px; margin-bottom: 5px; }
        .header p { font-size: 12px; color: #666; }
        .section { margin-bottom: 15px; }
        .section-title { font-size: 14px; font-weight: bold; border-bottom: 1px dashed #ccc; padding-bottom: 5px; margin-bottom: 10px; }
        .row { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; }
        .row.total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 8px; margin-top: 8px; }
        .row.diferencia { font-size: 16px; }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        .neutral { color: #2563eb; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #999; border-top: 1px dashed #ccc; padding-top: 10px; }
        @media print { body { padding: 10px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>CIERRE DE CAJA</h1>
        <p>${fecha}</p>
      </div>
      
      <div class="section">
        <div class="section-title">Ventas por Método de Pago</div>
        <div class="row">
          <span>Efectivo:</span>
          <span>$${parseFloat(cierre.total_efectivo).toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span>Tarjeta Débito:</span>
          <span>$${parseFloat(cierre.total_tarjeta_debito).toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span>Tarjeta Crédito:</span>
          <span>$${parseFloat(cierre.total_tarjeta_credito).toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span>Nequi:</span>
          <span>$${parseFloat(cierre.total_nequi || 0).toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span>Daviplata:</span>
          <span>$${parseFloat(cierre.total_daviplata || 0).toLocaleString('es-CO')}</span>
        </div>
        <div class="row total">
          <span>TOTAL VENTAS:</span>
          <span>$${parseFloat(cierre.total_ventas).toLocaleString('es-CO')}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Arqueo de Caja</div>
        <div class="row">
          <span>Efectivo Inicial:</span>
          <span>$${parseFloat(cierre.efectivo_inicial).toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span>Efectivo Final:</span>
          <span>$${parseFloat(cierre.efectivo_final).toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span>Efectivo Esperado:</span>
          <span>$${(parseFloat(cierre.efectivo_inicial) + parseFloat(cierre.total_efectivo)).toLocaleString('es-CO')}</span>
        </div>
        <div class="row total diferencia">
          <span>DIFERENCIA:</span>
          <span class="${parseFloat(cierre.diferencia) === 0 ? 'neutral' : parseFloat(cierre.diferencia) > 0 ? 'positive' : 'negative'}">
            $${parseFloat(cierre.diferencia).toLocaleString('es-CO')}
            ${parseFloat(cierre.diferencia) > 0 ? ' (Sobrante)' : parseFloat(cierre.diferencia) < 0 ? ' (Faltante)' : ''}
          </span>
        </div>
      </div>
      
      ${cierre.notas ? `
      <div class="section">
        <div class="section-title">Notas</div>
        <p style="font-size: 12px;">${cierre.notas}</p>
      </div>
      ` : ''}
      
      <div class="footer">
        Impreso el ${format(new Date(), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};

export function CierreCaja() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [efectivoInicial, setEfectivoInicial] = useState(0);
  const [efectivoFinal, setEfectivoFinal] = useState(0);
  const [notas, setNotas] = useState("");

  // Obtener resumen de ventas del día
  const { data: resumenDia, isLoading } = useQuery({
    queryKey: ['resumen-ventas-dia'],
    queryFn: async () => {
      const hoy = new Date();
      const inicio = startOfDay(hoy).toISOString();
      const fin = endOfDay(hoy).toISOString();

      const { data, error } = await supabase
        .from('facturas')
        .select('total, metodo_pago')
        .gte('created_at', inicio)
        .lte('created_at', fin);

      if (error) throw error;

      const efectivo = data?.filter(f => f.metodo_pago === 'efectivo' || !f.metodo_pago)
        .reduce((sum, f) => sum + parseFloat(String(f.total)), 0) || 0;
      const debito = data?.filter(f => f.metodo_pago === 'debito')
        .reduce((sum, f) => sum + parseFloat(String(f.total)), 0) || 0;
      const credito = data?.filter(f => f.metodo_pago === 'credito')
        .reduce((sum, f) => sum + parseFloat(String(f.total)), 0) || 0;
      const nequi = data?.filter(f => f.metodo_pago === 'nequi')
        .reduce((sum, f) => sum + parseFloat(String(f.total)), 0) || 0;
      const daviplata = data?.filter(f => f.metodo_pago === 'daviplata')
        .reduce((sum, f) => sum + parseFloat(String(f.total)), 0) || 0;
      const total = efectivo + debito + credito + nequi + daviplata;

      return { efectivo, debito, credito, nequi, daviplata, total, facturas: data?.length || 0 };
    },
  });

  // Obtener cierres anteriores
  const { data: cierresAnteriores } = useQuery({
    queryKey: ['cierres-caja'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cierres_caja')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Verificar si ya hay cierre hoy
  const { data: cierreHoy } = useQuery({
    queryKey: ['cierre-hoy'],
    queryFn: async () => {
      const hoy = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('cierres_caja')
        .select('*')
        .eq('fecha', hoy)
        .eq('cajero_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const cierreMutation = useMutation({
    mutationFn: async () => {
      const diferencia = efectivoFinal - efectivoInicial - (resumenDia?.efectivo || 0);
      
      const { error } = await supabase
        .from('cierres_caja')
        .insert({
          cajero_id: user?.id,
          efectivo_inicial: efectivoInicial,
          efectivo_final: efectivoFinal,
          total_efectivo: resumenDia?.efectivo || 0,
          total_tarjeta_debito: resumenDia?.debito || 0,
          total_tarjeta_credito: resumenDia?.credito || 0,
          total_nequi: resumenDia?.nequi || 0,
          total_daviplata: resumenDia?.daviplata || 0,
          total_ventas: resumenDia?.total || 0,
          diferencia,
          notas,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cierres-caja'] });
      queryClient.invalidateQueries({ queryKey: ['cierre-hoy'] });
      toast.success("Cierre de caja registrado correctamente");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error en cierre:', error);
      toast.error(error.message || "Error al registrar el cierre");
    },
  });

  const resetForm = () => {
    setEfectivoInicial(0);
    setEfectivoFinal(0);
    setNotas("");
  };

  const diferencia = efectivoFinal - efectivoInicial - (resumenDia?.efectivo || 0);

  return (
    <div className="space-y-6">
      {/* Resumen del día */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <Banknote className="w-8 h-8 text-green-500 mb-2" />
            <CardTitle className="text-sm font-medium">Efectivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${resumenDia?.efectivo.toLocaleString('es-CO') || '0'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CreditCard className="w-8 h-8 text-blue-500 mb-2" />
            <CardTitle className="text-sm font-medium">Tarjeta Débito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${resumenDia?.debito.toLocaleString('es-CO') || '0'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CreditCard className="w-8 h-8 text-purple-500 mb-2" />
            <CardTitle className="text-sm font-medium">Tarjeta Crédito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${resumenDia?.credito.toLocaleString('es-CO') || '0'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Smartphone className="w-8 h-8 text-[#E6007E] mb-2" />
            <CardTitle className="text-sm font-medium">Nequi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${resumenDia?.nequi.toLocaleString('es-CO') || '0'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Smartphone className="w-8 h-8 text-[#ED1C24] mb-2" />
            <CardTitle className="text-sm font-medium">Daviplata</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${resumenDia?.daviplata.toLocaleString('es-CO') || '0'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Wallet className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${resumenDia?.total.toLocaleString('es-CO') || '0'}</p>
            <p className="text-xs text-muted-foreground">{resumenDia?.facturas || 0} facturas</p>
          </CardContent>
        </Card>
      </div>

      {/* Botón de cierre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Cierre de Caja
          </CardTitle>
          <CardDescription>
            {cierreHoy 
              ? "Ya realizaste el cierre de caja de hoy" 
              : "Registra el cierre de caja del día"}
          </CardDescription>
        </CardHeader>
        <CardContent>
        {cierreHoy ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Cierre registrado - Diferencia: ${cierreHoy.diferencia.toLocaleString('es-CO')}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => printCierreReport(cierreHoy, format(new Date(cierreHoy.fecha), "d 'de' MMMM, yyyy", { locale: es }))}
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
            </div>
          ) : (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Calculator className="w-4 h-4" />
                  Realizar Cierre de Caja
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cierre de Caja - {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</DialogTitle>
                  <DialogDescription>
                    Ingresa los montos de efectivo para el cierre
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="efectivo-inicial">Efectivo Inicial</Label>
                      <Input
                        id="efectivo-inicial"
                        type="number"
                        min="0"
                        value={efectivoInicial}
                        onChange={(e) => setEfectivoInicial(Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="efectivo-final">Efectivo en Caja</Label>
                      <Input
                        id="efectivo-final"
                        type="number"
                        min="0"
                        value={efectivoFinal}
                        onChange={(e) => setEfectivoFinal(Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
                    <div className="flex justify-between text-sm">
                      <span>Ventas en Efectivo:</span>
                      <span className="font-medium">${resumenDia?.efectivo.toLocaleString('es-CO') || '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ventas Tarjeta Débito:</span>
                      <span className="font-medium">${resumenDia?.debito.toLocaleString('es-CO') || '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ventas Tarjeta Crédito:</span>
                      <span className="font-medium">${resumenDia?.credito.toLocaleString('es-CO') || '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ventas Nequi:</span>
                      <span className="font-medium">${resumenDia?.nequi.toLocaleString('es-CO') || '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ventas Daviplata:</span>
                      <span className="font-medium">${resumenDia?.daviplata.toLocaleString('es-CO') || '0'}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span>Efectivo esperado:</span>
                        <span className="font-medium">
                          ${(efectivoInicial + (resumenDia?.efectivo || 0)).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Efectivo contado:</span>
                        <span className="font-medium">${efectivoFinal.toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Diferencia:</span>
                        <span className={diferencia === 0 ? 'text-green-600' : diferencia > 0 ? 'text-blue-600' : 'text-red-600'}>
                          ${diferencia.toLocaleString('es-CO')}
                          {diferencia > 0 && ' (sobrante)'}
                          {diferencia < 0 && ' (faltante)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas (opcional)</Label>
                    <Textarea
                      id="notas"
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Observaciones del cierre..."
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={() => cierreMutation.mutate()} disabled={cierreMutation.isPending}>
                    {cierreMutation.isPending ? "Guardando..." : "Confirmar Cierre"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {/* Historial de cierres */}
      {cierresAnteriores && cierresAnteriores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Cierres</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Efectivo</TableHead>
                  <TableHead>Débito</TableHead>
                  <TableHead>Crédito</TableHead>
                  <TableHead>Nequi</TableHead>
                  <TableHead>Daviplata</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Diferencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cierresAnteriores.map((cierre: any) => (
                  <TableRow key={cierre.id}>
                    <TableCell>{format(new Date(cierre.fecha), "dd/MM/yyyy")}</TableCell>
                    <TableCell>${parseFloat(cierre.total_efectivo).toLocaleString('es-CO')}</TableCell>
                    <TableCell>${parseFloat(cierre.total_tarjeta_debito).toLocaleString('es-CO')}</TableCell>
                    <TableCell>${parseFloat(cierre.total_tarjeta_credito).toLocaleString('es-CO')}</TableCell>
                    <TableCell>${parseFloat(cierre.total_nequi || 0).toLocaleString('es-CO')}</TableCell>
                    <TableCell>${parseFloat(cierre.total_daviplata || 0).toLocaleString('es-CO')}</TableCell>
                    <TableCell className="font-medium">${parseFloat(cierre.total_ventas).toLocaleString('es-CO')}</TableCell>
                    <TableCell>
                      <Badge variant={cierre.diferencia === 0 ? 'default' : cierre.diferencia > 0 ? 'secondary' : 'destructive'}>
                        ${parseFloat(cierre.diferencia).toLocaleString('es-CO')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => printCierreReport(cierre, format(new Date(cierre.fecha), "d 'de' MMMM, yyyy", { locale: es }))}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
