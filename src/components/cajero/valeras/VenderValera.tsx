import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCOP } from "@/utils/formatCurrency";
import { imprimirValera } from "@/utils/printValera";
import { logError } from "@/utils/errorLogger";
import { toast } from "sonner";
import { Ticket, Printer } from "lucide-react";
import { addDays, format } from "date-fns";

const METODOS = ["efectivo", "debito", "credito", "nequi", "daviplata"] as const;

export function VenderValera() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [productoId, setProductoId] = useState<string>("");
  const [cantidad, setCantidad] = useState<string>("10");
  const [precioUnitario, setPrecioUnitario] = useState<string>("");
  const [cedula, setCedula] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<string>("efectivo");
  const [notas, setNotas] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState<string>("");

  const { data: config } = useQuery({
    queryKey: ["valeras-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("valeras_config").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: productos } = useQuery({
    queryKey: ["productos-valeras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio")
        .eq("disponible", true)
        .order("nombre");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!productoId && config?.producto_default_id) setProductoId(config.producto_default_id);
  }, [config, productoId]);

  useEffect(() => {
    if (!config) return;
    const vigencia = config.vigencia_dias ?? 0;
    setFechaVencimiento(vigencia > 0 ? format(addDays(new Date(), vigencia), "yyyy-MM-dd") : "");
  }, [config]);

  const reglas = useMemo(() => {
    const r: string[] = [];
    const c: any = config;
    if (!c) return r;
    if (c.max_por_consumo > 0) r.push(`máx ${c.max_por_consumo} por consumo`);
    if (c.max_por_dia > 0) r.push(`máx ${c.max_por_dia} por día`);
    const dias: number[] = c.dias_permitidos ?? [];
    if (dias.length > 0 && dias.length < 7) {
      const nombres = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      r.push(`solo ${[...dias].sort().map((d) => nombres[d]).join(", ")}`);
    }
    if (c.hora_inicio && c.hora_fin) r.push(`de ${String(c.hora_inicio).slice(0, 5)} a ${String(c.hora_fin).slice(0, 5)}`);
    return r;
  }, [config]);

  const producto = useMemo(
    () => productos?.find((p) => p.id === productoId),
    [productos, productoId]
  );

  useEffect(() => {
    if (producto) setPrecioUnitario(String(producto.precio));
  }, [producto]);

  const buscarCliente = async () => {
    if (!cedula.trim()) return;
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre, apellido")
      .eq("cedula", cedula.trim())
      .maybeSingle();
    if (error) {
      logError("Error buscando cliente para valera:", error);
      return;
    }
    if (data) {
      setClienteId(data.id);
      setNombreCliente(`${data.nombre ?? ""} ${data.apellido ?? ""}`.trim());
      toast.success("Cliente encontrado");
    } else {
      setClienteId(null);
      toast.info("Cliente nuevo, se guardará con esta valera");
    }
  };

  const cant = Number(cantidad) || 0;
  const precio = Number(precioUnitario) || 0;
  const total = cant * precio;

  const vender = useMutation({
    mutationFn: async () => {
      if (!producto) throw new Error("Selecciona el producto de la valera");
      if (cant <= 0) throw new Error("La cantidad debe ser mayor a cero");
      if (precio <= 0) throw new Error("El precio unitario debe ser mayor a cero");

      // Cliente
      let finalClienteId = clienteId;
      if (!finalClienteId && (cedula.trim() || nombreCliente.trim())) {
        const { data: nuevo, error: errCliente } = await supabase
          .from("clientes")
          .insert({
            cedula: cedula.trim() || null,
            nombre: nombreCliente.trim() || null,
          })
          .select("id")
          .single();
        if (errCliente) {
          logError("No se pudo crear el cliente de la valera:", errCliente);
        } else {
          finalClienteId = nuevo.id;
        }
      }

      // Código único
      const { data: codigo, error: errCodigo } = await supabase.rpc("generar_codigo_valera");
      if (errCodigo) throw errCodigo;

      // Factura de la venta del paquete (ingreso real)
      const { data: factura, error: errFactura } = await supabase
        .from("facturas")
        .insert({
          orden_id: null,
          cajero_id: user?.id,
          cliente_id: finalClienteId,
          nombre_cliente: nombreCliente.trim() || "Cliente valera",
          subtotal: total,
          impuestos: 0,
          propina: 0,
          total,
          metodo_pago: metodoPago,
          es_venta_valera: true,
        })
        .select()
        .single();
      if (errFactura) throw errFactura;

      const { error: errItem } = await supabase.from("factura_items").insert({
        factura_id: factura.id,
        producto_id: null,
        producto_nombre: `Valera ${codigo} · ${cant} x ${producto.nombre}`,
        cantidad: cant,
        precio_unitario: precio,
        subtotal: total,
      });
      if (errItem) throw errItem;

      const vencimiento = fechaVencimiento || null;

      const { data: valera, error: errValera } = await supabase
        .from("valeras")
        .insert({
          codigo: codigo as string,
          cliente_id: finalClienteId,
          nombre_cliente: nombreCliente.trim() || null,
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          cantidad_total: cant,
          precio_unitario: precio,
          total_pagado: total,
          metodo_pago_venta: metodoPago,
          fecha_vencimiento: vencimiento,
          factura_venta_id: factura.id,
          vendida_por: user?.id,
          notas: notas.trim() || null,
        })
        .select()
        .single();
      if (errValera) throw errValera;

      return valera;
    },
    onSuccess: async (valera) => {
      toast.success(`Valera ${valera.codigo} creada`, { description: formatCOP(Number(valera.total_pagado)) });
      queryClient.invalidateQueries({ queryKey: ["valeras-lista"] });
      queryClient.invalidateQueries({ queryKey: ["estadisticas-cajero-hoy"] });
      setCedula("");
      setNombreCliente("");
      setClienteId(null);
      setNotas("");
      if (config?.vigencia_dias) {
        setFechaVencimiento(format(addDays(new Date(), config.vigencia_dias), "yyyy-MM-dd"));
      }
      await imprimirValera({
        codigo: valera.codigo,
        qr_token: valera.qr_token,
        producto_nombre: valera.producto_nombre,
        cantidad_total: valera.cantidad_total,
        cantidad_usada: valera.cantidad_usada,
        precio_unitario: Number(valera.precio_unitario),
        total_pagado: Number(valera.total_pagado),
        nombre_cliente: valera.nombre_cliente,
        fecha_vencimiento: valera.fecha_vencimiento,
      });
    },
    onError: (e: any) => {
      logError("Error vendiendo valera:", e);
      toast.error(e?.message || "No se pudo crear la valera");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          Vender valera
        </CardTitle>
        <CardDescription>Cobra almuerzos por adelantado y entrega el código QR al cliente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Producto de la valera</Label>
          <Select value={productoId} onValueChange={setProductoId}>
            <SelectTrigger><SelectValue placeholder="Selecciona el almuerzo" /></SelectTrigger>
            <SelectContent>
              {productos?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre} · {formatCOP(Number(p.precio))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cantidad de almuerzos</Label>
          <div className="flex gap-2 flex-wrap">
            {[10, 20, 30].map((n) => (
              <Button
                key={n}
                type="button"
                size="sm"
                variant={cantidad === String(n) ? "default" : "outline"}
                onClick={() => setCantidad(String(n))}
              >
                {n}
              </Button>
            ))}
            <Input
              type="number"
              min={1}
              className="w-28"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Valor unitario</Label>
            <Input
              type="number"
              min={0}
              value={precioUnitario}
              onChange={(e) => setPrecioUnitario(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Método de pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METODOS.map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Cédula del cliente</Label>
            <div className="flex gap-2">
              <Input value={cedula} onChange={(e) => setCedula(e.target.value)} onBlur={buscarCliente} placeholder="Opcional" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nombre del cliente</Label>
            <Input value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} placeholder="Opcional" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Fecha límite de uso</Label>
          <Input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            {config?.vigencia_dias
              ? `Sugerida por configuración: ${config.vigencia_dias} días. Puedes ajustarla.`
              : "Déjala vacía para una valera sin vencimiento."}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Notas</Label>
          <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej. empresa, convenio…" />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted p-4">
          <div>
            <p className="text-sm text-muted-foreground">Total a cobrar</p>
            <p className="text-2xl font-bold">{formatCOP(total)}</p>
          </div>
          <Badge variant="secondary">
            {cant} x {formatCOP(precio)}
          </Badge>
        </div>

        <Button className="w-full" disabled={vender.isPending || !producto || total <= 0} onClick={() => vender.mutate()}>
          <Printer className="w-4 h-4 mr-2" />
          {vender.isPending ? "Generando…" : "Cobrar y generar valera"}
        </Button>

        {reglas.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">Reglas de uso: {reglas.join(" · ")}</p>
        )}
      </CardContent>
    </Card>
  );
}
