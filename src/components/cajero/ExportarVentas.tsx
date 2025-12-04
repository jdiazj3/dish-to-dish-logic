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
import * as XLSX from "xlsx";

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

  const exportToExcel = async () => {
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

      // Crear hoja de resumen de facturas
      const resumenData = facturas.map((f: any) => ({
        'N° Factura': f.consecutivo,
        'Cliente': f.nombre_cliente,
        'Fecha': format(new Date(f.created_at), "dd/MM/yyyy HH:mm"),
        'Subtotal': parseFloat(f.subtotal),
        'Impuestos': parseFloat(f.impuestos),
        'Propina': parseFloat(f.propina || 0),
        'Total': parseFloat(f.total),
      }));

      // Crear hoja de detalle de productos
      const detalleData: any[] = [];
      facturas.forEach((f: any) => {
        f.factura_items?.forEach((item: any) => {
          detalleData.push({
            'N° Factura': f.consecutivo,
            'Fecha': format(new Date(f.created_at), "dd/MM/yyyy"),
            'Producto': item.producto_nombre,
            'Cantidad': item.cantidad,
            'Precio Unitario': parseFloat(item.precio_unitario),
            'Subtotal': parseFloat(item.subtotal),
          });
        });
      });

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

      // Crear workbook
      const wb = XLSX.utils.book_new();
      
      // Hoja de resumen
      const wsResumen = XLSX.utils.json_to_sheet(resumenData);
      wsResumen['!cols'] = [
        { wch: 12 }, { wch: 25 }, { wch: 18 }, 
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }
      ];
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Facturas");

      // Hoja de detalle
      if (detalleData.length > 0) {
        const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
        wsDetalle['!cols'] = [
          { wch: 12 }, { wch: 12 }, { wch: 30 }, 
          { wch: 10 }, { wch: 14 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle Productos");
      }

      // Generar nombre del archivo
      const fechaInicio = format(dateRange.from, "yyyyMMdd");
      const fechaFin = format(dateRange.to || dateRange.from, "yyyyMMdd");
      const fileName = `Ventas_${fechaInicio}_${fechaFin}.xlsx`;

      // Descargar
      XLSX.writeFile(wb, fileName);
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
          <DialogTitle>Exportar Ventas a Excel</DialogTitle>
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
            onClick={exportToExcel} 
            disabled={isExporting || !dateRange?.from}
            className="w-full gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exportando..." : "Descargar Excel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
