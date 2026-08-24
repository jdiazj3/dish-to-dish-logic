import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EscanerValera } from "@/components/cajero/valeras/EscanerValera";
import { formatCOP } from "@/utils/formatCurrency";
import { logError } from "@/utils/errorLogger";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus, Ticket, Utensils } from "lucide-react";
import { format } from "date-fns";

type Valera = {
  id: string;
  codigo: string;
  producto_id: string | null;
  producto_nombre: string;
  cantidad_total: number;
  cantidad_usada: number;
  precio_unitario: number;
  estado: string;
  fecha_vencimiento: string | null;
  nombre_cliente: string | null;
  cliente_id: string | null;
};

export default function CajeroCobrarValera() {
  const { user } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [valera, setValera] = useState<Valera | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [buscando, setBuscando] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["valeras-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("valeras_config").select("*").maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const disponibles = valera ? valera.cantidad_total - valera.cantidad_usada : 0;
  const maxConsumo = config?.max_por_consumo > 0 ? Math.min(disponibles, config.max_por_consumo) : disponibles;
  const diasPermitidos: number[] = config?.dias_permitidos ?? [0, 1, 2, 3, 4, 5, 6];
  const diaOk = diasPermitidos.includes(new Date().getDay());
  const horaActual = format(new Date(), "HH:mm:ss");
  const horaOk =
    !config?.hora_inicio || !config?.hora_fin || (horaActual >= config.hora_inicio && horaActual <= config.hora_fin);
  const vencida = !!valera?.fecha_vencimiento && new Date(`${valera.fecha_vencimiento}T23:59:59`) < new Date();
  const utilizable = !!valera && valera.estado === "activa" && disponibles > 0 && !vencida && diaOk && horaOk;

  const buscar = async (codigo: string) => {
    setBuscando(true);
    try {
      await supabase.rpc("marcar_valeras_vencidas");
      const { data, error } = await supabase.rpc("buscar_valera", { _codigo: codigo });
      if (error) throw error;
      const encontrada = (Array.isArray(data) ? data[0] : data) as Valera | null;
      if (!encontrada) {
        setValera(null);
        toast.error("Valera no encontrada");
        return;
      }
      setValera(encontrada);
      setCantidad(1);
    } catch (e: any) {
      logError("Error buscando valera:", e);
      toast.error(e?.message || "No se pudo consultar la valera");
    } finally {
      setBuscando(false);
    }
  };

  const redimir = useMutation({
    mutationFn: async () => {
      if (!valera) throw new Error("Escanea una valera primero");
      if (cantidad < 1 || cantidad > disponibles) throw new Error("Cantidad inválida");

      const { data: factura, error: errFactura } = await supabase
        .from("facturas")
        .insert({
          orden_id: null,
          cajero_id: user?.id,
          cliente_id: valera.cliente_id,
          nombre_cliente: valera.nombre_cliente || `Valera ${valera.codigo}`,
          subtotal: 0,
          impuestos: 0,
          propina: 0,
          total: 0,
          metodo_pago: "valera",
          referencia_pago: valera.codigo,
          valera_id: valera.id,
        })
        .select()
        .single();
      if (errFactura) throw errFactura;

      const { error: errItem } = await supabase.from("factura_items").insert({
        factura_id: factura.id,
        producto_id: valera.producto_id,
        producto_nombre: `${valera.producto_nombre} (valera ${valera.codigo})`,
        cantidad,
        precio_unitario: 0,
        subtotal: 0,
      });
      if (errItem) throw errItem;

      const { data: actualizada, error: errRpc } = await supabase.rpc("consumir_valera", {
        _codigo: valera.codigo,
        _cantidad: cantidad,
        _factura_id: factura.id,
      });
      if (errRpc) throw errRpc;

      return { factura, valera: (Array.isArray(actualizada) ? actualizada[0] : actualizada) as Valera };
    },
    onSuccess: ({ factura, valera: actualizada }) => {
      toast.success(`Factura #${factura.consecutivo} generada`, {
        description: `Quedan ${actualizada.cantidad_total - actualizada.cantidad_usada} almuerzos`,
      });
      setValera(actualizada);
      setCantidad(1);
      queryClient.invalidateQueries({ queryKey: ["valeras-lista"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas-cajero-hoy"] });
    },
    onError: (e: any) => {
      logError("Error redimiendo valera:", e);
      toast.error(e?.message || "No se pudo redimir la valera");
    },
  });

  if (isLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando…</div>;
  }
  const permitido = roles?.some((r) => ["cajero", "admin_total", "admin_sede"].includes(r));
  if (!permitido) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cajero")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Cobrar con valera</h1>
            <p className="text-sm text-muted-foreground">Escanea el QR del cliente y descuenta almuerzos</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Leer valera
            </CardTitle>
            <CardDescription>Usa la cámara o escribe el código impreso</CardDescription>
          </CardHeader>
          <CardContent>
            <EscanerValera onCodigo={buscar} />
            {buscando && <p className="text-sm text-muted-foreground mt-3">Consultando…</p>}
          </CardContent>
        </Card>

        {valera && (
          <Card className={utilizable ? "border-primary/40" : "border-destructive/40"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono">{valera.codigo}</CardTitle>
                <Badge variant={utilizable ? "default" : "destructive"} className="capitalize">
                  {vencida && valera.estado === "activa" ? "vencida" : valera.estado}
                </Badge>
              </div>
              <CardDescription>{valera.nombre_cliente || "Sin cliente asociado"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{valera.producto_nombre}</p>
                  <p className="text-2xl font-bold">
                    {disponibles} <span className="text-base font-normal text-muted-foreground">de {valera.cantidad_total} disponibles</span>
                  </p>
                </div>
                <Utensils className="w-8 h-8 text-primary" />
              </div>

              <div className="text-sm text-muted-foreground flex justify-between">
                <span>Valor unitario prepagado</span>
                <span>{formatCOP(Number(valera.precio_unitario))}</span>
              </div>
              {valera.fecha_vencimiento && (
                <div className="text-sm text-muted-foreground flex justify-between">
                  <span>Vence</span>
                  <span>{format(new Date(`${valera.fecha_vencimiento}T00:00:00`), "dd/MM/yyyy")}</span>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Almuerzos a consumir</Label>
                {config?.max_por_consumo > 0 && (
                  <p className="text-xs text-muted-foreground">Máximo {config.max_por_consumo} por consumo</p>
                )}
                {config?.max_por_dia > 0 && (
                  <p className="text-xs text-muted-foreground">Máximo {config.max_por_dia} por día por valera</p>
                )}
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setCantidad((c) => Math.max(1, c - 1))} disabled={!utilizable}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={maxConsumo}
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.min(maxConsumo, Math.max(1, Number(e.target.value) || 1)))}
                    className="text-center w-24"
                    disabled={!utilizable}
                  />
                  <Button variant="outline" size="icon" onClick={() => setCantidad((c) => Math.min(maxConsumo, c + 1))} disabled={!utilizable}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!utilizable || redimir.isPending}
                onClick={() => redimir.mutate()}
              >
                {redimir.isPending ? "Procesando…" : `Descontar ${cantidad} y generar factura`}
              </Button>

              {!utilizable && (
                <p className="text-sm text-destructive text-center">
                  {vencida
                    ? `Esta valera venció el ${format(new Date(`${valera.fecha_vencimiento}T00:00:00`), "dd/MM/yyyy")}.`
                    : disponibles === 0
                    ? "Esta valera ya no tiene almuerzos disponibles."
                    : !diaOk
                    ? "Hoy no es un día permitido para redimir valeras."
                    : !horaOk
                    ? `Las valeras solo se redimen entre ${String(config?.hora_inicio).slice(0, 5)} y ${String(config?.hora_fin).slice(0, 5)}.`
                    : "Esta valera no se puede usar."}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
