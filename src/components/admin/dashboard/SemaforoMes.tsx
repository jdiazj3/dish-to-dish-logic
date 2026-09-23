import { Card, CardContent } from "@/components/ui/card";
import { formatCOP } from "@/utils/formatCurrency";
import { TrendingUp, TrendingDown, DollarSign, Package, Percent, Building2, Wallet } from "lucide-react";

interface Props {
  ventas: number;
  ventasPrev: number;
  cmv: number;
  margenContribucion: number;
  porcentajeContribucion: number;
  gastosFijos: number;
  gastosVariables: number;
  utilidadOperativa: number;
}

function Variacion({ actual, previo }: { actual: number; previo: number }) {
  if (!previo) return null;
  const pct = ((actual - previo) / Math.abs(previo)) * 100;
  const sube = pct >= 0;
  return (
    <p className={`text-xs flex items-center gap-1 mt-1 ${sube ? "text-green-600" : "text-red-600"}`}>
      {sube ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(pct).toFixed(1)}% vs. mes anterior
    </p>
  );
}

export function SemaforoMes({
  ventas,
  ventasPrev,
  cmv,
  margenContribucion,
  porcentajeContribucion,
  gastosFijos,
  gastosVariables,
  utilidadOperativa,
}: Props) {
  const gana = utilidadOperativa >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">Ventas</span>
          </div>
          <p className="text-2xl font-bold">{formatCOP(ventas)}</p>
          <Variacion actual={ventas} previo={ventasPrev} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">Costo de lo vendido</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{formatCOP(cmv)}</p>
          <p className="text-xs text-muted-foreground mt-1">Insumos de los platos vendidos</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-sm font-medium">Margen de contribución</span>
          </div>
          <p className="text-2xl font-bold">{formatCOP(margenContribucion)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {(porcentajeContribucion * 100).toFixed(1)}% de las ventas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">Gastos del período</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{formatCOP(gastosFijos + gastosVariables)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Fijos {formatCOP(gastosFijos)} · Variables {formatCOP(gastosVariables)}
          </p>
        </CardContent>
      </Card>

      <Card className={gana ? "border-green-500/40" : "border-red-500/40"}>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">{gana ? "Ganancia" : "Pérdida"}</span>
          </div>
          <p className={`text-2xl font-bold ${gana ? "text-green-600" : "text-red-600"}`}>
            {formatCOP(Math.abs(utilidadOperativa))}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Ventas − costos − gastos</p>
        </CardContent>
      </Card>
    </div>
  );
}
