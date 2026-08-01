import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, Mail, X } from "lucide-react";
import { formatCOP as formatCurrency } from "@/utils/formatCurrency";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logError } from "@/utils/errorLogger";

interface AlertaMargenBajoProps {
  margenActual: number;
  margenMinimo: number;
  totalInversion: number;
  totalVentas: number;
  ganancia: number;
  fechaInicio?: Date;
  fechaFin?: Date;
  emailConfigurado?: boolean;
}

export function AlertaMargenBajo({
  margenActual,
  margenMinimo,
  totalInversion,
  totalVentas,
  ganancia,
  fechaInicio,
  fechaFin,
  emailConfigurado = false,
}: AlertaMargenBajoProps) {
  const [dismissed, setDismissed] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const margenBajo = margenActual < margenMinimo;
  const esNegativo = ganancia < 0;

  if (!margenBajo || dismissed) {
    return null;
  }

  const periodo = fechaInicio && fechaFin
    ? `${fechaInicio.toLocaleDateString('es-CO')} - ${fechaFin.toLocaleDateString('es-CO')}`
    : "Período actual";

  const enviarAlertaEmail = async () => {
    setEnviandoEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("alerta-margen-bajo", {
        body: {
          margenActual,
          margenMinimo,
          totalInversion,
          totalVentas,
          ganancia,
          periodo,
        },
      });

      if (error) throw error;
      toast.success("Alerta enviada por correo electrónico");
    } catch (error) {
      logError("Error al enviar alerta:", error)
      toast.error("Error al enviar el correo de alerta");
    } finally {
      setEnviandoEmail(false);
    }
  };

  return (
    <Alert variant="destructive" className="relative border-2 border-destructive/50 bg-destructive/10">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-start gap-3">
        {esNegativo ? (
          <TrendingDown className="h-6 w-6 text-destructive mt-0.5" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-amber-500 mt-0.5" />
        )}
        
        <div className="flex-1 space-y-2">
          <AlertTitle className="text-lg font-bold">
            {esNegativo ? "¡Pérdida detectada!" : "Margen de ganancia bajo"}
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {esNegativo 
                ? `El negocio está operando con pérdidas. Has invertido ${formatCurrency(totalInversion)} y solo has vendido ${formatCurrency(totalVentas)}, resultando en una pérdida de ${formatCurrency(Math.abs(ganancia))}.`
                : `El margen de ganancia actual (${margenActual.toFixed(1)}%) está por debajo del umbral configurado (${margenMinimo}%).`
              }
            </p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-background/50 px-3 py-2 rounded-md">
                <span className="text-muted-foreground">Margen actual: </span>
                <span className={`font-bold ${esNegativo ? 'text-destructive' : 'text-amber-500'}`}>
                  {margenActual.toFixed(1)}%
                </span>
              </div>
              <div className="bg-background/50 px-3 py-2 rounded-md">
                <span className="text-muted-foreground">Umbral mínimo: </span>
                <span className="font-bold">{margenMinimo}%</span>
              </div>
              <div className="bg-background/50 px-3 py-2 rounded-md">
                <span className="text-muted-foreground">{esNegativo ? 'Pérdida' : 'Ganancia'}: </span>
                <span className={`font-bold ${esNegativo ? 'text-destructive' : 'text-amber-500'}`}>
                  {formatCurrency(Math.abs(ganancia))}
                </span>
              </div>
            </div>

            {emailConfigurado && (
              <Button
                variant="outline"
                size="sm"
                onClick={enviarAlertaEmail}
                disabled={enviandoEmail}
                className="mt-2"
              >
                <Mail className="w-4 h-4 mr-2" />
                {enviandoEmail ? "Enviando..." : "Enviar alerta por email"}
              </Button>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
