import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP as formatCurrency } from "@/utils/formatCurrency";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Wallet, Package, FileDown } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface ReporteRentabilidadProps {
  totalInversion: number;
  totalVentas: number;
  ganancia: number;
  margenGanancia: number;
  detalleInversion: {
    productos: number;
    insumos: number;
  };
  inversionPorDia: Array<{
    fecha: string;
    inversion: number;
    ventas: number;
    ganancia: number;
  }>;
  fechaInicio?: Date;
  fechaFin?: Date;
}

const chartConfig = {
  inversion: {
    label: "Inversión",
    color: "hsl(var(--chart-1))",
  },
  ventas: {
    label: "Ventas",
    color: "hsl(var(--chart-2))",
  },
  ganancia: {
    label: "Ganancia",
    color: "hsl(var(--chart-3))",
  },
};

export function ReporteRentabilidad({
  totalInversion,
  totalVentas,
  ganancia,
  margenGanancia,
  detalleInversion,
  inversionPorDia,
  fechaInicio,
  fechaFin,
}: ReporteRentabilidadProps) {
  const esRentable = ganancia >= 0;

  const dataPie = [
    { name: "Productos", value: detalleInversion.productos, fill: "hsl(var(--chart-1))" },
    { name: "Insumos", value: detalleInversion.insumos, fill: "hsl(var(--chart-4))" },
  ].filter(d => d.value > 0);

  const exportarPDF = () => {
    try {
      const doc = new jsPDF();
      const fechaReporte = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Título
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Reporte de Rentabilidad", 105, 20, { align: "center" });

      // Período
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const periodoTexto = fechaInicio && fechaFin 
        ? `Período: ${fechaInicio.toLocaleDateString('es-CO')} - ${fechaFin.toLocaleDateString('es-CO')}`
        : `Generado: ${fechaReporte}`;
      doc.text(periodoTexto, 105, 30, { align: "center" });

      // Línea separadora
      doc.setDrawColor(200);
      doc.line(20, 35, 190, 35);

      // Resumen Principal
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Resumen de Rentabilidad", 20, 50);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      
      // Inversión
      doc.setTextColor(220, 53, 69);
      doc.text(`Inversión Total: ${formatCurrency(totalInversion)}`, 20, 65);
      
      // Ventas
      doc.setTextColor(40, 167, 69);
      doc.text(`Ventas Totales: ${formatCurrency(totalVentas)}`, 20, 75);
      
      // Ganancia
      const colorGanancia = esRentable ? [40, 167, 69] : [220, 53, 69];
      doc.setTextColor(colorGanancia[0], colorGanancia[1], colorGanancia[2]);
      doc.text(`${esRentable ? 'Ganancia' : 'Pérdida'}: ${formatCurrency(Math.abs(ganancia))}`, 20, 85);
      
      // Margen
      doc.setTextColor(0, 0, 0);
      doc.text(`Margen de Ganancia: ${margenGanancia.toFixed(1)}%`, 20, 95);

      // Línea separadora
      doc.line(20, 105, 190, 105);

      // Detalle de Inversión
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Detalle de Inversión", 20, 120);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Productos para venta: ${formatCurrency(detalleInversion.productos)}`, 25, 132);
      doc.text(`Insumos del restaurante: ${formatCurrency(detalleInversion.insumos)}`, 25, 142);

      // Línea separadora
      doc.line(20, 152, 190, 152);

      // Detalle por Día
      if (inversionPorDia.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Detalle por Día", 20, 167);

        // Encabezados de tabla
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Fecha", 25, 180);
        doc.text("Inversión", 70, 180);
        doc.text("Ventas", 110, 180);
        doc.text("Ganancia", 150, 180);

        doc.setFont("helvetica", "normal");
        let yPos = 188;
        inversionPorDia.slice(0, 10).forEach((dia) => {
          doc.text(dia.fecha, 25, yPos);
          doc.text(formatCurrency(dia.inversion), 70, yPos);
          doc.text(formatCurrency(dia.ventas), 110, yPos);
          const ganDia = dia.ventas - dia.inversion;
          doc.setTextColor(ganDia >= 0 ? 40 : 220, ganDia >= 0 ? 167 : 53, ganDia >= 0 ? 69 : 69);
          doc.text(formatCurrency(ganDia), 150, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 8;
        });
      }

      // Mensaje resumen al final
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      const mensajeResumen = esRentable 
        ? `Resumen: Invertiste ${formatCurrency(totalInversion)}, vendiste ${formatCurrency(totalVentas)} y obtuviste una ganancia de ${formatCurrency(ganancia)} (${margenGanancia.toFixed(1)}% de margen)`
        : `Resumen: Invertiste ${formatCurrency(totalInversion)}, vendiste ${formatCurrency(totalVentas)} resultando en una pérdida de ${formatCurrency(Math.abs(ganancia))}`;
      
      const splitMensaje = doc.splitTextToSize(mensajeResumen, 170);
      doc.text(splitMensaje, 20, 270);

      // Guardar PDF
      const nombreArchivo = `Reporte_Rentabilidad_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);
      toast.success("Reporte exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast.error("Error al generar el PDF");
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen Principal */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wallet className="w-6 h-6 text-primary" />
                Resumen de Rentabilidad
              </CardTitle>
              <CardDescription>
                Comparación entre inversión en inventario y ventas del período
              </CardDescription>
            </div>
            <Button onClick={exportarPDF} variant="outline" className="gap-2">
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Inversión Total */}
            <div className="bg-card rounded-lg p-4 border shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ShoppingCart className="w-4 h-4" />
                <span className="text-sm font-medium">Invertí</span>
              </div>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(totalInversion)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Compras de inventario
              </p>
            </div>

            {/* Ventas Totales */}
            <div className="bg-card rounded-lg p-4 border shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Vendí</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(totalVentas)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total facturado
              </p>
            </div>

            {/* Ganancia */}
            <div className={`bg-card rounded-lg p-4 border shadow-sm ${esRentable ? 'border-green-500/30' : 'border-red-500/30'}`}>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {esRentable ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {esRentable ? 'Gané' : 'Perdí'}
                </span>
              </div>
              <p className={`text-2xl font-bold ${esRentable ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(Math.abs(ganancia))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ventas - Inversión
              </p>
            </div>

            {/* Margen de Ganancia */}
            <div className="bg-card rounded-lg p-4 border shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="w-4 h-4" />
                <span className="text-sm font-medium">Margen</span>
              </div>
              <p className={`text-2xl font-bold ${margenGanancia >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {margenGanancia.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Rentabilidad
              </p>
            </div>
          </div>

          {/* Mensaje Resumen */}
          <div className={`mt-6 p-4 rounded-lg ${esRentable ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            <p className={`text-center font-medium ${esRentable ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {esRentable 
                ? `¡Excelente! Invertiste ${formatCurrency(totalInversion)}, vendiste ${formatCurrency(totalVentas)} y obtuviste una ganancia de ${formatCurrency(ganancia)} (${margenGanancia.toFixed(1)}% de margen)`
                : `Atención: Invertiste ${formatCurrency(totalInversion)}, vendiste ${formatCurrency(totalVentas)} resultando en una pérdida de ${formatCurrency(Math.abs(ganancia))}`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Barras - Comparativa por Día */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inversión vs Ventas por Día</CardTitle>
            <CardDescription>Comparativa diaria del período</CardDescription>
          </CardHeader>
          <CardContent>
            {inversionPorDia.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inversionPorDia}>
                    <XAxis 
                      dataKey="fecha" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      }
                    />
                    <Bar 
                      dataKey="inversion" 
                      name="Inversión"
                      fill="hsl(var(--chart-1))" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="ventas" 
                      name="Ventas"
                      fill="hsl(var(--chart-2))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos para el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Torta - Distribución de Inversión */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Inversión</CardTitle>
            <CardDescription>Productos vs Insumos</CardDescription>
          </CardHeader>
          <CardContent>
            {dataPie.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      labelLine={false}
                    >
                      {dataPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos de inversión
              </div>
            )}

            {/* Detalle de inversión */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Productos para venta:</span>
                <span className="font-medium">{formatCurrency(detalleInversion.productos)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Insumos del restaurante:</span>
                <span className="font-medium">{formatCurrency(detalleInversion.insumos)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
