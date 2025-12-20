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
import { Wallet, CreditCard, Banknote, Calculator, CheckCircle, Smartphone, Printer, Download } from "lucide-react";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import { formatCOP } from "@/utils/formatCurrency";

const downloadCierrePDF = (cierre: any, fecha: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200]
  });

  const pageWidth = 80;
  const margin = 5;
  const contentWidth = pageWidth - (margin * 2);
  let y = 10;

  // Configuración de fuentes
  doc.setFont("courier", "bold");
  
  // Header
  doc.setFontSize(14);
  doc.text("ANCESTRALE", pageWidth / 2, y, { align: "center" });
  y += 6;
  
  doc.setFontSize(11);
  doc.text("CIERRE DE CAJA", pageWidth / 2, y, { align: "center" });
  y += 5;
  
  doc.setFontSize(9);
  doc.setFont("courier", "normal");
  doc.text(fecha, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Sección: Ventas por método de pago
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.text("VENTAS POR METODO DE PAGO", pageWidth / 2, y, { align: "center" });
  y += 5;
  
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);
  y += 5;

  doc.setFont("courier", "normal");
  doc.setFontSize(8);

  const addRow = (label: string, value: string) => {
    doc.text(label, margin, y);
    doc.text(value, pageWidth - margin, y, { align: "right" });
    y += 4;
  };

  addRow("Efectivo", `$${parseFloat(cierre.total_efectivo).toLocaleString('es-CO')}`);
  addRow("Tarjeta Debito", `$${parseFloat(cierre.total_tarjeta_debito).toLocaleString('es-CO')}`);
  addRow("Tarjeta Credito", `$${parseFloat(cierre.total_tarjeta_credito).toLocaleString('es-CO')}`);
  addRow("Nequi", `$${parseFloat(cierre.total_nequi || 0).toLocaleString('es-CO')}`);
  addRow("Daviplata", `$${parseFloat(cierre.total_daviplata || 0).toLocaleString('es-CO')}`);
  
  y += 2;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL VENTAS", margin, y);
  doc.text(`$${parseFloat(cierre.total_ventas).toLocaleString('es-CO')}`, pageWidth - margin, y, { align: "right" });
  y += 6;

  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Sección: Arqueo de Caja
  doc.setFontSize(9);
  doc.text("ARQUEO DE CAJA", pageWidth / 2, y, { align: "center" });
  y += 5;
  
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);
  y += 5;

  doc.setFont("courier", "normal");
  doc.setFontSize(8);

  const efectivoEsperado = parseFloat(cierre.efectivo_inicial) + parseFloat(cierre.total_efectivo);
  
  addRow("Base inicial", `$${parseFloat(cierre.efectivo_inicial).toLocaleString('es-CO')}`);
  addRow("+ Ventas efectivo", `$${parseFloat(cierre.total_efectivo).toLocaleString('es-CO')}`);
  
  y += 1;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);
  y += 4;
  
  addRow("= Esperado", `$${efectivoEsperado.toLocaleString('es-CO')}`);
  addRow("Contado", `$${parseFloat(cierre.efectivo_final).toLocaleString('es-CO')}`);
  
  y += 3;

  // Diferencia destacada
  const diferenciaNum = parseFloat(cierre.diferencia);
  const diferenciaText = diferenciaNum === 0 ? "CUADRE PERFECTO" : diferenciaNum > 0 ? "SOBRANTE" : "FALTANTE";
  
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, contentWidth, 18, 'F');
  doc.rect(margin, y, contentWidth, 18, 'S');
  
  y += 5;
  doc.setFontSize(8);
  doc.text("DIFERENCIA", pageWidth / 2, y, { align: "center" });
  y += 6;
  
  doc.setFont("courier", "bold");
  doc.setFontSize(14);
  doc.text(`$${Math.abs(diferenciaNum).toLocaleString('es-CO')}`, pageWidth / 2, y, { align: "center" });
  y += 5;
  
  doc.setFontSize(8);
  doc.text(diferenciaText, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Notas
  if (cierre.notas) {
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.text("NOTAS:", margin, y);
    y += 4;
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    const splitNotas = doc.splitTextToSize(cierre.notas, contentWidth);
    doc.text(splitNotas, margin, y);
    y += splitNotas.length * 3 + 4;
  }

  // Footer
  y += 5;
  doc.setFontSize(8);
  doc.text("* * * * * * * * * *", pageWidth / 2, y, { align: "center" });
  y += 5;
  
  doc.setFontSize(7);
  doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.text("Gracias por su trabajo", pageWidth / 2, y, { align: "center" });

  // Descargar PDF
  const fileName = `cierre-caja-${format(new Date(cierre.fecha), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
  toast.success("PDF descargado correctamente");
};

const printCierreReport = (cierre: any, fecha: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error("No se pudo abrir la ventana de impresión");
    return;
  }

  const efectivoEsperado = parseFloat(cierre.efectivo_inicial) + parseFloat(cierre.total_efectivo);
  const diferenciaNum = parseFloat(cierre.diferencia);
  const diferenciaClass = diferenciaNum === 0 ? '' : diferenciaNum > 0 ? 'sobrante' : 'faltante';
  const diferenciaText = diferenciaNum > 0 ? '(+)' : diferenciaNum < 0 ? '(-)' : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cierre de Caja - ${fecha}</title>
      <style>
        @page { 
          size: 80mm auto; 
          margin: 0; 
        }
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        body { 
          font-family: 'Courier New', 'Lucida Console', monospace; 
          font-size: 12px;
          width: 80mm;
          max-width: 80mm;
          padding: 8px;
          background: #fff;
          color: #000;
          line-height: 1.4;
        }
        .receipt {
          width: 100%;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .separator {
          border-bottom: 1px dashed #000;
          margin: 8px 0;
        }
        .double-separator {
          border-bottom: 2px solid #000;
          margin: 8px 0;
        }
        .header {
          text-align: center;
          padding-bottom: 8px;
        }
        .header .logo {
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 2px;
        }
        .header .subtitle {
          font-size: 14px;
          font-weight: bold;
          margin-top: 4px;
        }
        .header .date {
          font-size: 11px;
          margin-top: 4px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
        }
        .row .label {
          flex: 1;
        }
        .row .value {
          text-align: right;
          font-weight: bold;
        }
        .section-title {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 1px;
          margin: 4px 0;
        }
        .total-row {
          font-size: 14px;
          font-weight: bold;
          padding: 6px 0;
        }
        .total-row .value {
          font-size: 16px;
        }
        .diferencia-section {
          background: #f5f5f5;
          padding: 8px;
          margin: 8px 0;
          border: 1px solid #000;
        }
        .diferencia-section.sobrante .value { }
        .diferencia-section.faltante .value { }
        .diferencia-label {
          font-size: 10px;
          text-transform: uppercase;
        }
        .diferencia-value {
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin-top: 4px;
        }
        .notas {
          font-size: 10px;
          padding: 4px;
          border: 1px dashed #999;
          margin-top: 8px;
        }
        .notas-title {
          font-weight: bold;
          font-size: 10px;
        }
        .footer {
          text-align: center;
          font-size: 9px;
          margin-top: 12px;
          padding-top: 8px;
        }
        .footer .timestamp {
          margin-top: 4px;
        }
        .stars {
          letter-spacing: 2px;
        }
        @media print {
          body {
            width: 80mm;
            padding: 4px;
          }
        }
        @media screen {
          body {
            margin: 20px auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">ANCESTRALE</div>
          <div class="subtitle">CIERRE DE CAJA</div>
          <div class="date">${fecha}</div>
        </div>
        
        <div class="double-separator"></div>
        
        <div class="section-title center">Ventas por Metodo de Pago</div>
        <div class="separator"></div>
        
        <div class="row">
          <span class="label">Efectivo</span>
          <span class="value">$${parseFloat(cierre.total_efectivo).toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span class="label">Tarjeta Debito</span>
          <span class="value">$${parseFloat(cierre.total_tarjeta_debito).toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span class="label">Tarjeta Credito</span>
          <span class="value">$${parseFloat(cierre.total_tarjeta_credito).toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span class="label">Nequi</span>
          <span class="value">$${parseFloat(cierre.total_nequi || 0).toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span class="label">Daviplata</span>
          <span class="value">$${parseFloat(cierre.total_daviplata || 0).toLocaleString('es-CO')}</span>
        </div>
        
        <div class="double-separator"></div>
        
        <div class="row total-row">
          <span class="label">TOTAL VENTAS</span>
          <span class="value">$${parseFloat(cierre.total_ventas).toLocaleString('es-CO')}</span>
        </div>
        
        <div class="double-separator"></div>
        
        <div class="section-title center">Arqueo de Caja</div>
        <div class="separator"></div>
        
        <div class="row">
          <span class="label">Base inicial</span>
          <span class="value">$${parseFloat(cierre.efectivo_inicial).toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span class="label">+ Ventas efectivo</span>
          <span class="value">$${parseFloat(cierre.total_efectivo).toLocaleString('es-CO')}</span>
        </div>
        <div class="separator"></div>
        <div class="row">
          <span class="label">= Esperado</span>
          <span class="value">$${efectivoEsperado.toLocaleString('es-CO')}</span>
        </div>
        <div class="row">
          <span class="label">Contado</span>
          <span class="value">$${parseFloat(cierre.efectivo_final).toLocaleString('es-CO')}</span>
        </div>
        
        <div class="diferencia-section ${diferenciaClass}">
          <div class="diferencia-label center">DIFERENCIA ${diferenciaText}</div>
          <div class="diferencia-value">$${Math.abs(diferenciaNum).toLocaleString('es-CO')}</div>
          <div class="center" style="font-size: 10px; margin-top: 4px;">
            ${diferenciaNum === 0 ? 'CUADRE PERFECTO' : diferenciaNum > 0 ? 'SOBRANTE' : 'FALTANTE'}
          </div>
        </div>
        
        ${cierre.notas ? `
        <div class="notas">
          <div class="notas-title">NOTAS:</div>
          <div>${cierre.notas}</div>
        </div>
        ` : ''}
        
        <div class="footer">
          <div class="stars">* * * * * * * * * *</div>
          <div class="timestamp">
            Impreso: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
          </div>
          <div style="margin-top: 8px;">Gracias por su trabajo</div>
        </div>
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
            <p className="text-2xl font-bold">{formatCOP(resumenDia?.efectivo || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CreditCard className="w-8 h-8 text-blue-500 mb-2" />
            <CardTitle className="text-sm font-medium">Tarjeta Débito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCOP(resumenDia?.debito || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CreditCard className="w-8 h-8 text-purple-500 mb-2" />
            <CardTitle className="text-sm font-medium">Tarjeta Crédito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCOP(resumenDia?.credito || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Smartphone className="w-8 h-8 text-[#E6007E] mb-2" />
            <CardTitle className="text-sm font-medium">Nequi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCOP(resumenDia?.nequi || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Smartphone className="w-8 h-8 text-[#ED1C24] mb-2" />
            <CardTitle className="text-sm font-medium">Daviplata</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCOP(resumenDia?.daviplata || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Wallet className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCOP(resumenDia?.total || 0)}</p>
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
                <span>Cierre registrado - Diferencia: {formatCOP(cierreHoy.diferencia)}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => printCierreReport(cierreHoy, format(new Date(cierreHoy.fecha), "d 'de' MMMM, yyyy", { locale: es }))}
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => downloadCierrePDF(cierreHoy, format(new Date(cierreHoy.fecha), "d 'de' MMMM, yyyy", { locale: es }))}
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
              </div>
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
                      <span className="font-medium">{formatCOP(resumenDia?.efectivo || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ventas Tarjeta Débito:</span>
                      <span className="font-medium">{formatCOP(resumenDia?.debito || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ventas Tarjeta Crédito:</span>
                      <span className="font-medium">{formatCOP(resumenDia?.credito || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ventas Nequi:</span>
                      <span className="font-medium">{formatCOP(resumenDia?.nequi || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ventas Daviplata:</span>
                      <span className="font-medium">{formatCOP(resumenDia?.daviplata || 0)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span>Efectivo esperado:</span>
                        <span className="font-medium">
                          {formatCOP(efectivoInicial + (resumenDia?.efectivo || 0))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Efectivo contado:</span>
                        <span className="font-medium">{formatCOP(efectivoFinal)}</span>
                      </div>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Diferencia:</span>
                        <span className={diferencia === 0 ? 'text-green-600' : diferencia > 0 ? 'text-blue-600' : 'text-red-600'}>
                          {formatCOP(diferencia)}
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
                    <TableCell>{formatCOP(cierre.total_efectivo)}</TableCell>
                    <TableCell>{formatCOP(cierre.total_tarjeta_debito)}</TableCell>
                    <TableCell>{formatCOP(cierre.total_tarjeta_credito)}</TableCell>
                    <TableCell>{formatCOP(cierre.total_nequi || 0)}</TableCell>
                    <TableCell>{formatCOP(cierre.total_daviplata || 0)}</TableCell>
                    <TableCell className="font-medium">{formatCOP(cierre.total_ventas)}</TableCell>
                    <TableCell>
                      <Badge variant={cierre.diferencia === 0 ? 'default' : cierre.diferencia > 0 ? 'secondary' : 'destructive'}>
                        {formatCOP(cierre.diferencia)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title="Imprimir"
                          onClick={() => printCierreReport(cierre, format(new Date(cierre.fecha), "d 'de' MMMM, yyyy", { locale: es }))}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title="Descargar PDF"
                          onClick={() => downloadCierrePDF(cierre, format(new Date(cierre.fecha), "d 'de' MMMM, yyyy", { locale: es }))}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
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
