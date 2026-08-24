import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCOP } from "@/utils/formatCurrency";
import { imprimirValera } from "@/utils/printValera";
import { format } from "date-fns";
import { Printer, Search, History } from "lucide-react";

const estadoVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  activa: "default",
  agotada: "secondary",
  vencida: "outline",
  anulada: "destructive",
};

export function ListaValeras() {
  const [busqueda, setBusqueda] = useState("");
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const { data: valeras, isLoading } = useQuery({
    queryKey: ["valeras-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("valeras")
        .select("*, clientes(nombre, apellido, cedula)")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: consumos } = useQuery({
    queryKey: ["valera-consumos", detalleId],
    enabled: !!detalleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("valera_consumos")
        .select("id, cantidad, created_at, facturas(consecutivo)")
        .eq("valera_id", detalleId as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const q = busqueda.trim().toLowerCase();
  const filtradas = (valeras || []).filter((v: any) => {
    if (!q) return true;
    const cliente = `${v.clientes?.nombre ?? ""} ${v.clientes?.apellido ?? ""} ${v.clientes?.cedula ?? ""} ${v.nombre_cliente ?? ""}`;
    return v.codigo.toLowerCase().includes(q) || cliente.toLowerCase().includes(q);
  });

  const detalle = (valeras || []).find((v: any) => v.id === detalleId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valeras emitidas</CardTitle>
        <CardDescription>Consulta saldos, estados y consumos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por código, cliente o cédula"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Saldo</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Cargando…</TableCell></TableRow>
              )}
              {!isLoading && filtradas.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Sin valeras</TableCell></TableRow>
              )}
              {filtradas.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono font-medium">{v.codigo}</TableCell>
                  <TableCell>
                    {v.nombre_cliente || `${v.clientes?.nombre ?? ""} ${v.clientes?.apellido ?? ""}`.trim() || "—"}
                  </TableCell>
                  <TableCell>{v.producto_nombre}</TableCell>
                  <TableCell className="text-center font-medium">
                    {v.cantidad_total - v.cantidad_usada} / {v.cantidad_total}
                  </TableCell>
                  <TableCell className="text-right">{formatCOP(Number(v.total_pagado))}</TableCell>
                  <TableCell>{v.fecha_vencimiento ? format(new Date(`${v.fecha_vencimiento}T00:00:00`), "dd/MM/yyyy") : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={estadoVariant[v.estado] || "outline"} className="capitalize">{v.estado}</Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" onClick={() => setDetalleId(v.id)} title="Ver consumos">
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Reimprimir"
                      onClick={() =>
                        imprimirValera({
                          codigo: v.codigo,
                          qr_token: v.qr_token,
                          producto_nombre: v.producto_nombre,
                          cantidad_total: v.cantidad_total,
                          cantidad_usada: v.cantidad_usada,
                          precio_unitario: Number(v.precio_unitario),
                          total_pagado: Number(v.total_pagado),
                          nombre_cliente: v.nombre_cliente,
                          fecha_vencimiento: v.fecha_vencimiento,
                        })
                      }
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={!!detalleId} onOpenChange={(o) => !o && setDetalleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Consumos de {detalle?.codigo}</DialogTitle>
            <DialogDescription>
              {detalle ? `${detalle.cantidad_total - detalle.cantidad_usada} de ${detalle.cantidad_total} almuerzos disponibles` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(consumos || []).length === 0 && (
              <p className="text-sm text-muted-foreground">Aún no se ha redimido ningún almuerzo.</p>
            )}
            {(consumos || []).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>{format(new Date(c.created_at), "dd/MM/yyyy HH:mm")}</span>
                <span className="text-muted-foreground">
                  {c.facturas?.consecutivo ? `Factura #${c.facturas.consecutivo}` : "Sin factura"}
                </span>
                <Badge variant="secondary">-{c.cantidad}</Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
