import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Download, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function jsonToCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const headerRow = headers.map(escapeCSVValue).join(',');
  const rows = data.map(row => 
    headers.map(header => escapeCSVValue(row[header])).join(',')
  );
  return [headerRow, ...rows].join('\n');
}

function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function ExportarVentas() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [isExporting, setIsExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatDateRange = () => {
    if (!dateRange?.from) return "Seleccionar fechas";
    if (!dateRange.to || dateRange.from.toDateString() === dateRange.to.toDateString()) {
      return format(dateRange.from, "d MMM yyyy", { locale: es });
    }
    return `${format(dateRange.from, "d MMM", { locale: es })} - ${format(dateRange.to, "d MMM yyyy", { locale: es })}`;
  };

  const exportToCSV = async () => {
    if (!dateRange?.from) {
      toast.error("Selecciona un rango de fechas");
      return;
    }

    setIsExporting(true);
    try {
      const inicio = startOfDay(dateRange.from).toISOString();
      const fin = endOfDay(dateRange.to || dateRange.from).toISOString();

      // Obtener facturas con sus items
      const { data: facturas, error } = await supabase
        .from('facturas')
        .select(`
          consecutivo,
          nombre_cliente,
          subtotal,
          impuestos,
          propina,
          total,
          created_at,
          factura_items(producto_nombre, cantidad, precio_unitario, subtotal)
        `)
        .gte('created_at', inicio)
        .lte('created_at', fin)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!facturas || facturas.length === 0) {
        toast.error("No hay facturas en el rango seleccionado");
        setIsExporting(false);
        return;
      }

      // Crear datos de resumen de facturas
      const resumenData = facturas.map((f: any) => ({
        'N° Factura': f.consecutivo,
        'Cliente': f.nombre_cliente,
        'Fecha': format(new Date(f.created_at), "dd/MM/yyyy HH:mm"),
        'Subtotal': parseFloat(f.subtotal),
        'Impuestos': parseFloat(f.impuestos),
        'Propina': parseFloat(f.propina || 0),
        'Total': parseFloat(f.total),
      }));

      // Calcular totales
      const totales = facturas.reduce((acc: any, f: any) => ({
        subtotal: acc.subtotal + parseFloat(f.subtotal),
        impuestos: acc.impuestos + parseFloat(f.impuestos),
        propinas: acc.propinas + parseFloat(f.propina || 0),
        total: acc.total + parseFloat(f.total),
      }), { subtotal: 0, impuestos: 0, propinas: 0, total: 0 });

      // Agregar fila de totales
      resumenData.push({
        'N° Factura': '',
        'Cliente': 'TOTALES',
        'Fecha': '',
        'Subtotal': totales.subtotal,
        'Impuestos': totales.impuestos,
        'Propina': totales.propinas,
        'Total': totales.total,
      });

      // Generar nombre del archivo
      const fechaInicio = format(dateRange.from, "yyyyMMdd");
      const fechaFin = format(dateRange.to || dateRange.from, "yyyyMMdd");
      const fileName = `Ventas_${fechaInicio}_${fechaFin}.csv`;

      // Descargar CSV
      const csv = jsonToCSV(resumenData);
      downloadCSV(csv, fileName);
      
      toast.success("Archivo exportado correctamente");
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error exportando:', error);
      toast.error(error.message || "Error al exportar");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Ventas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Ventas</DialogTitle>
          <DialogDescription>
            Selecciona el rango de fechas para exportar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rango de Fechas</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={es}
                  disabled={(date) => date > new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button 
            onClick={exportToCSV} 
            disabled={isExporting || !dateRange?.from}
            className="w-full gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exportando..." : "Descargar CSV"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
