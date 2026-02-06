import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCOP } from "@/utils/formatCurrency";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, FileText, Download } from "lucide-react";
import { exportToCSV } from "@/utils/exportReportes";

interface Movimiento {
  id: string;
  tipo: 'entrada' | 'salida' | 'reposicion';
  monto: number;
  descripcion: string;
  notas: string | null;
  comprobante_url: string | null;
  estado: string;
  fecha_movimiento: string;
  created_at: string;
  categoria_gasto: {
    nombre: string;
  } | null;
  registrado_por_profile: {
    nombre: string;
    apellido: string;
  } | null;
}

export function HistorialMovimientos() {
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: movimientos = [], isLoading } = useQuery({
    queryKey: ['movimientos-caja', filtroTipo, fechaInicio, fechaFin],
    queryFn: async () => {
      let query = supabase
        .from('movimientos_caja')
        .select(`
          *,
          categoria_gasto:categorias_gastos(nombre),
          registrado_por_profile:profiles!movimientos_caja_registrado_por_fkey(nombre, apellido)
        `)
        .gte('fecha_movimiento', fechaInicio)
        .lte('fecha_movimiento', fechaFin)
        .order('created_at', { ascending: false });

      if (filtroTipo !== "todos") {
        query = query.eq('tipo', filtroTipo as 'entrada' | 'salida' | 'reposicion');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Movimiento[];
    }
  });

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'salida':
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case 'reposicion':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Entrada</Badge>;
      case 'salida':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Salida</Badge>;
      case 'reposicion':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Reposición</Badge>;
      default:
        return <Badge>{tipo}</Badge>;
    }
  };

  const handleExport = () => {
    const datos = movimientos.map(m => ({
      Fecha: format(new Date(m.fecha_movimiento), 'dd/MM/yyyy'),
      Tipo: m.tipo === 'entrada' ? 'Entrada' : m.tipo === 'salida' ? 'Salida' : 'Reposición',
      Monto: m.monto,
      Categoría: m.categoria_gasto?.nombre || '-',
      Descripción: m.descripcion,
      Registrado_por: m.registrado_por_profile ? `${m.registrado_por_profile.nombre} ${m.registrado_por_profile.apellido}` : '-',
      Notas: m.notas || ''
    }));
    exportToCSV(datos, `movimientos-caja-${fechaInicio}-${fechaFin}`);
  };

  const totalEntradas = movimientos.filter(m => m.tipo === 'entrada' || m.tipo === 'reposicion').reduce((sum, m) => sum + Number(m.monto), 0);
  const totalSalidas = movimientos.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + Number(m.monto), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Historial de Movimientos</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Desde:</span>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Hasta:</span>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-auto"
            />
          </div>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="salida">Salidas</SelectItem>
              <SelectItem value="reposicion">Reposiciones</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resumen del período */}
        <div className="flex gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-sm">
            <span className="text-muted-foreground">Entradas: </span>
            <span className="font-medium text-green-600">{formatCOP(totalEntradas)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Salidas: </span>
            <span className="font-medium text-red-600">{formatCOP(totalSalidas)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Balance: </span>
            <span className={`font-medium ${totalEntradas - totalSalidas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCOP(totalEntradas - totalSalidas)}
            </span>
          </div>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando...</div>
        ) : movimientos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay movimientos en el período seleccionado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Registrado por</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(mov.fecha_movimiento), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTipoIcon(mov.tipo)}
                        {getTipoBadge(mov.tipo)}
                      </div>
                    </TableCell>
                    <TableCell className={`font-medium ${mov.tipo === 'salida' ? 'text-red-600' : 'text-green-600'}`}>
                      {mov.tipo === 'salida' ? '-' : '+'}{formatCOP(mov.monto)}
                    </TableCell>
                    <TableCell>
                      {mov.categoria_gasto?.nombre || '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={mov.descripcion}>
                      {mov.descripcion}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {mov.registrado_por_profile 
                        ? `${mov.registrado_por_profile.nombre} ${mov.registrado_por_profile.apellido}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {mov.comprobante_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(mov.comprobante_url!, '_blank')}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
