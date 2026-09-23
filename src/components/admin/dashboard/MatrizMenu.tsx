import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/utils/formatCurrency";
import type { ProductoRentable } from "@/hooks/useIndicadoresFinancieros";

interface Props {
  productos: ProductoRentable[];
}

const CUADRANTES = [
  {
    id: "estrella",
    titulo: "Estrellas",
    accion: "Se venden mucho y dejan buen margen: destácalos en la carta.",
    clase: "border-green-500/40 bg-green-500/5",
  },
  {
    id: "caballo",
    titulo: "Caballos de batalla",
    accion: "Se venden mucho pero dejan poco: sube el precio o ajusta la receta.",
    clase: "border-amber-500/40 bg-amber-500/5",
  },
  {
    id: "rompecabezas",
    titulo: "Rompecabezas",
    accion: "Dejan buen margen pero casi no se piden: que el mesero los sugiera.",
    clase: "border-blue-500/40 bg-blue-500/5",
  },
  {
    id: "perro",
    titulo: "Para revisar",
    accion: "Poca venta y poco margen: considera sacarlos del menú.",
    clase: "border-red-500/40 bg-red-500/5",
  },
] as const;

export function MatrizMenu({ productos }: Props) {
  const grupos = useMemo(() => {
    const conVenta = productos.filter((p) => p.cantidad > 0);
    if (conVenta.length === 0) return {} as Record<string, ProductoRentable[]>;

    const cantidadPromedio = conVenta.reduce((a, p) => a + p.cantidad, 0) / conVenta.length;
    const margenPromedio = conVenta.reduce((a, p) => a + p.margenUnitario, 0) / conVenta.length;

    const res: Record<string, ProductoRentable[]> = {
      estrella: [],
      caballo: [],
      rompecabezas: [],
      perro: [],
    };

    conVenta.forEach((p) => {
      const popular = p.cantidad >= cantidadPromedio;
      const rentable = p.margenUnitario >= margenPromedio;
      if (popular && rentable) res.estrella.push(p);
      else if (popular && !rentable) res.caballo.push(p);
      else if (!popular && rentable) res.rompecabezas.push(p);
      else res.perro.push(p);
    });

    Object.values(res).forEach((lista) => lista.sort((a, b) => b.ventas - a.ventas));
    return res;
  }, [productos]);

  const hayDatos = Object.values(grupos).some((g) => g?.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Qué platos te conviene empujar</CardTitle>
        <CardDescription>
          Cruce entre cuánto se vende cada plato y cuánta ganancia deja cada uno
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hayDatos ? (
          <p className="text-sm text-muted-foreground">Aún no hay ventas en el período seleccionado.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {CUADRANTES.map((c) => (
              <div key={c.id} className={`rounded-lg border p-3 ${c.clase}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold">{c.titulo}</p>
                  <Badge variant="secondary">{grupos[c.id]?.length || 0}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{c.accion}</p>
                <div className="space-y-1">
                  {(grupos[c.id] || []).slice(0, 5).map((p) => (
                    <div key={p.producto_id} className="flex items-center justify-between text-sm">
                      <span className="truncate mr-2">{p.nombre}</span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {p.cantidad} · {formatCOP(p.margenUnitario)} c/u
                      </span>
                    </div>
                  ))}
                  {(grupos[c.id]?.length || 0) > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{(grupos[c.id]?.length || 0) - 5} más
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
