import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIndicadoresFinancieros } from "@/hooks/useIndicadoresFinancieros";
import { SemaforoMes } from "./SemaforoMes";
import { PanelPuntoEquilibrio } from "./PanelPuntoEquilibrio";
import { EstructuraCostos } from "./EstructuraCostos";
import { MatrizMenu } from "./MatrizMenu";
import { ProyeccionFlujoCaja } from "./ProyeccionFlujoCaja";

type Periodo = "actual" | "anterior";

export function PanelFinanciero() {
  const [periodo, setPeriodo] = useState<Periodo>("actual");
  const base = periodo === "actual" ? new Date() : subMonths(new Date(), 1);
  const fechaInicio = startOfMonth(base);
  const fechaFin = endOfMonth(base);

  const ind = useIndicadoresFinancieros({ fechaInicio, fechaFin });

  const { data: config } = useQuery({
    queryKey: ["alertas-config-panel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alertas_rentabilidad_config")
        .select("margen_minimo")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const margenMinimo = Number(config?.margen_minimo ?? 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Salud financiera</h2>
          <p className="text-sm text-muted-foreground">
            Ventas, costos reales de insumos y gastos de caja en un solo lugar
          </p>
        </div>
        <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <TabsList>
            <TabsTrigger value="actual">Este mes</TabsTrigger>
            <TabsTrigger value="anterior">Mes anterior</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <SemaforoMes
        ventas={ind.ventas}
        ventasPrev={ind.ventasPrev}
        cmv={ind.cmv}
        margenContribucion={ind.margenContribucion}
        porcentajeContribucion={ind.porcentajeContribucion}
        gastosFijos={ind.gastosFijos}
        gastosVariables={ind.gastosVariables}
        utilidadOperativa={ind.utilidadOperativa}
      />

      <PanelPuntoEquilibrio
        ventas={ind.ventas}
        puntoEquilibrio={ind.puntoEquilibrio}
        puntoEquilibrioDiario={ind.puntoEquilibrioDiario}
        avance={ind.avancePuntoEquilibrio}
        ticketPromedio={ind.ticketPromedio}
        ticketsDiaNecesarios={ind.ticketsDiaNecesarios}
        porcentajeContribucion={ind.porcentajeContribucion}
        gastosFijos={ind.gastosFijos}
        diasPeriodo={ind.periodo.diasPeriodo}
      />

      <EstructuraCostos
        cmv={ind.cmv}
        gastosFijos={ind.gastosFijos}
        gastosVariables={ind.gastosVariables}
        utilidadOperativa={ind.utilidadOperativa}
        gastosPorCategoria={ind.gastosPorCategoria}
        productos={ind.productos}
        margenMinimo={margenMinimo}
      />

      <MatrizMenu productos={ind.productos} />

      <ProyeccionFlujoCaja
        ventaDiariaPromedio={ind.ventas / Math.max(1, ind.periodo.diasPeriodo)}
      />
    </div>
  );
}
