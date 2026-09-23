import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCOP } from "@/utils/formatCurrency";
import { Target, CalendarCheck, Utensils } from "lucide-react";

interface Props {
  ventas: number;
  puntoEquilibrio: number;
  puntoEquilibrioDiario: number;
  avance: number;
  ticketPromedio: number;
  ticketsDiaNecesarios: number;
  porcentajeContribucion: number;
  gastosFijos: number;
  diasPeriodo: number;
}

export function PanelPuntoEquilibrio({
  ventas,
  puntoEquilibrio,
  puntoEquilibrioDiario,
  avance,
  ticketPromedio,
  ticketsDiaNecesarios,
  porcentajeContribucion,
  gastosFijos,
  diasPeriodo,
}: Props) {
  const cubierto = ventas >= puntoEquilibrio && puntoEquilibrio > 0;
  const falta = Math.max(0, puntoEquilibrio - ventas);
  const ventaDiariaActual = ventas / Math.max(1, diasPeriodo);
  const diaEstimado =
    ventaDiariaActual > 0 && puntoEquilibrio > 0
      ? Math.ceil(puntoEquilibrio / ventaDiariaActual)
      : null;

  if (puntoEquilibrio <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Punto de equilibrio
          </CardTitle>
          <CardDescription>
            Necesitas registrar gastos fijos (nómina, arriendo, servicios) y las recetas de tus platos
            para calcular cuánto debes vender para no perder plata.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Punto de equilibrio
        </CardTitle>
        <CardDescription>
          Cuánto tienes que vender en el período para cubrir todos tus gastos fijos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-3xl font-bold">{formatCOP(puntoEquilibrio)}</p>
              <p className="text-xs text-muted-foreground">
                Gastos fijos {formatCOP(gastosFijos)} ÷ margen {(porcentajeContribucion * 100).toFixed(1)}%
              </p>
            </div>
            <p className={`text-2xl font-bold ${cubierto ? "text-green-600" : "text-amber-600"}`}>
              {avance.toFixed(0)}%
            </p>
          </div>
          <Progress value={avance} className="h-3" />
          <p className={`mt-2 text-sm font-medium ${cubierto ? "text-green-700" : "text-amber-700"}`}>
            {cubierto
              ? `Ya cubriste tus gastos fijos. Todo lo que vendas de más es ganancia.`
              : `Vas en ${formatCOP(ventas)}. Te faltan ${formatCOP(falta)} para no perder plata.`}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CalendarCheck className="w-4 h-4" />
              <span className="text-xs font-medium">Necesitas vender al día</span>
            </div>
            <p className="text-xl font-bold">{formatCOP(puntoEquilibrioDiario)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Utensils className="w-4 h-4" />
              <span className="text-xs font-medium">Cuentas por día</span>
            </div>
            <p className="text-xl font-bold">
              {ticketsDiaNecesarios > 0 ? Math.ceil(ticketsDiaNecesarios) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              con ticket promedio de {formatCOP(ticketPromedio)}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Lo cubres el día</span>
            </div>
            <p className="text-xl font-bold">
              {diaEstimado ? `${diaEstimado} del período` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">al ritmo de venta actual</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Si haces esto:</p>
          <div className="grid gap-2 sm:grid-cols-3 text-sm">
            <div className="rounded-md border p-2">
              <p className="font-medium">Subes precios 5%</p>
              <p className="text-muted-foreground text-xs">
                Punto de equilibrio baja a{" "}
                {formatCOP(gastosFijos / Math.min(0.99, porcentajeContribucion + 0.05 * (1 - porcentajeContribucion)))}
              </p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-medium">Bajas costo de insumos 5%</p>
              <p className="text-muted-foreground text-xs">
                Baja a{" "}
                {formatCOP(
                  gastosFijos / Math.min(0.99, porcentajeContribucion + 0.05 * (1 - porcentajeContribucion))
                )}
              </p>
            </div>
            <div className="rounded-md border p-2">
              <p className="font-medium">Recortas 10% de gastos fijos</p>
              <p className="text-muted-foreground text-xs">
                Baja a {formatCOP((gastosFijos * 0.9) / Math.max(0.01, porcentajeContribucion))}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
