import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP } from "@/utils/formatCurrency";
import { ArrowDownCircle, ArrowUpCircle, Wallet, AlertTriangle } from "lucide-react";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";

interface CajaMenorConfig {
  monto_base: number;
  umbral_reposicion: number;
}

export function ResumenFlujoCaja() {
  const hoy = new Date();

  // Obtener ventas del día (entradas desde facturas)
  const { data: ventasDia = 0 } = useQuery({
    queryKey: ['ventas-dia-flujo', format(hoy, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturas')
        .select('total')
        .gte('created_at', startOfDay(hoy).toISOString())
        .lte('created_at', endOfDay(hoy).toISOString());
      
      if (error) throw error;
      return data?.reduce((sum, f) => sum + Number(f.total), 0) || 0;
    }
  });

  // Obtener movimientos del día
  const { data: movimientosDia } = useQuery({
    queryKey: ['movimientos-dia', format(hoy, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimientos_caja')
        .select('tipo, monto')
        .eq('fecha_movimiento', format(hoy, 'yyyy-MM-dd'))
        .eq('estado', 'aprobado');
      
      if (error) throw error;
      
      const salidas = data?.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + Number(m.monto), 0) || 0;
      const entradas = data?.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + Number(m.monto), 0) || 0;
      const reposiciones = data?.filter(m => m.tipo === 'reposicion').reduce((sum, m) => sum + Number(m.monto), 0) || 0;
      
      return { salidas, entradas, reposiciones };
    }
  });

  // Obtener movimientos del mes
  const { data: movimientosMes } = useQuery({
    queryKey: ['movimientos-mes', format(hoy, 'yyyy-MM')],
    queryFn: async () => {
      const inicioMes = startOfMonth(hoy);
      const finMes = endOfMonth(hoy);
      
      const { data, error } = await supabase
        .from('movimientos_caja')
        .select('tipo, monto')
        .gte('fecha_movimiento', format(inicioMes, 'yyyy-MM-dd'))
        .lte('fecha_movimiento', format(finMes, 'yyyy-MM-dd'))
        .eq('estado', 'aprobado');
      
      if (error) throw error;
      
      const salidas = data?.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + Number(m.monto), 0) || 0;
      
      return { salidasMes: salidas };
    }
  });

  // Obtener configuración de caja menor
  const { data: cajaMenorConfig } = useQuery({
    queryKey: ['caja-menor-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caja_menor_config')
        .select('*')
        .eq('activo', true)
        .single();
      
      if (error) throw error;
      return data as CajaMenorConfig;
    }
  });

  // Calcular saldo de caja menor
  const { data: saldoCajaMenor = 0 } = useQuery({
    queryKey: ['saldo-caja-menor'],
    queryFn: async () => {
      // Obtener todas las reposiciones y salidas para calcular el saldo
      const { data, error } = await supabase
        .from('movimientos_caja')
        .select('tipo, monto')
        .eq('estado', 'aprobado');
      
      if (error) throw error;
      
      const reposiciones = data?.filter(m => m.tipo === 'reposicion').reduce((sum, m) => sum + Number(m.monto), 0) || 0;
      const salidas = data?.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + Number(m.monto), 0) || 0;
      
      // Saldo = monto base + reposiciones - salidas
      const montoBase = cajaMenorConfig?.monto_base || 500000;
      return montoBase + reposiciones - salidas;
    },
    enabled: !!cajaMenorConfig
  });

  const umbralBajo = cajaMenorConfig?.umbral_reposicion || 100000;
  const necesitaReposicion = saldoCajaMenor < umbralBajo;

  const salidasDia = movimientosDia?.salidas || 0;
  const entradasDia = (movimientosDia?.entradas || 0) + ventasDia;
  const balanceDia = entradasDia - salidasDia;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entradas Hoy</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCOP(entradasDia)}</div>
          <p className="text-xs text-muted-foreground">
            Ventas + otros ingresos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Salidas Hoy</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCOP(salidasDia)}</div>
          <p className="text-xs text-muted-foreground">
            Gastos registrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance Día</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${balanceDia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCOP(balanceDia)}
          </div>
          <p className="text-xs text-muted-foreground">
            {format(hoy, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </CardContent>
      </Card>

      <Card className={necesitaReposicion ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Caja Menor</CardTitle>
          {necesitaReposicion ? (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          ) : (
            <Wallet className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${necesitaReposicion ? 'text-yellow-600' : ''}`}>
            {formatCOP(saldoCajaMenor)}
          </div>
          {necesitaReposicion && (
            <p className="text-xs text-yellow-600 font-medium">
              ⚠️ Requiere reposición
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Gastos mes: {formatCOP(movimientosMes?.salidasMes || 0)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
