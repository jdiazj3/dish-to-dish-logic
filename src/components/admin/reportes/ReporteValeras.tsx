import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCOP } from "@/utils/formatCurrency";
import { Ticket, Wallet, Utensils, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Props {
  fechaInicio?: Date;
  fechaFin?: Date;
}

export function ReporteValeras({ fechaInicio, fechaFin }: Props) {
  const desde = fechaInicio?.toISOString();
  const hasta = fechaFin?.toISOString();

  const { data: valeras } = useQuery({
    queryKey: ["reporte-valeras", desde, hasta],
    queryFn: async () => {
      let query = supabase
        .from("valeras")
        .select("*")
        .order("created_at", { ascending: false });
      if (desde) query = query.gte("created_at", desde);
      if (hasta) query = query.lte("created_at", hasta);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const lista = valeras || [];
  const hoy = new Date();

  const dineroAnticipado = lista.reduce((acc, v) => acc + Number(v.total_pagado), 0);
  const almuerzosVendidos = lista.reduce((acc, v) => acc + v.cantidad_total, 0);
  const almuerzosPendientes = lista
    .filter((v) => v.estado !== "anulada")
    .reduce((acc, v) => acc + (v.cantidad_total - v.cantidad_usada), 0);
  const pasivo = lista
    .filter((v) => v.estado !== "anulada")
    .reduce((acc, v) => acc + (v.cantidad_total - v.cantidad_usada) * Number(v.precio_unitario), 0);
  const vencidasSinUsar = lista.filter(
    (v) =>
      v.fecha_vencimiento &&
      new Date(`${v.fecha_vencimiento}T23:59:59`) < hoy &&
      v.cantidad_usada < v.cantidad_total &&
      v.estado !== "anulada"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          Valeras (almuerzos prepagados)
        </CardTitle>
        <CardDescription>Ingresos por adelantado y almuerzos pendientes de entregar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Wallet className="w-4 h-4" /> Dinero recibido
            </div>
            <p className="text-xl font-bold mt-1">{formatCOP(dineroAnticipado)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Ticket className="w-4 h-4" /> Valeras vendidas
            </div>
            <p className="text-xl font-bold mt-1">{lista.length}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Utensils className="w-4 h-4" /> Almuerzos vendidos
            </div>
            <p className="text-xl font-bold mt-1">{almuerzosVendidos}</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <AlertTriangle className="w-4 h-4" /> Pendientes por entregar
            </div>
            <p className="text-xl font-bold mt-1">{almuerzosPendientes}</p>
            <p className="text-xs text-muted-foreground">{formatCOP(pasivo)} por servir</p>
          </div>
        </div>

        {vencidasSinUsar.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
            {vencidasSinUsar.length} valera(s) vencidas con almuerzos sin redimir.
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center">Usados</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin valeras en el período</TableCell></TableRow>
              )}
              {lista.slice(0, 50).map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono">{v.codigo}</TableCell>
                  <TableCell>{format(new Date(v.created_at), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{v.nombre_cliente || "—"}</TableCell>
                  <TableCell className="text-center">{v.cantidad_usada} / {v.cantidad_total}</TableCell>
                  <TableCell className="text-right">{formatCOP(Number(v.total_pagado))}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{v.estado}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
