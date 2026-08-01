import { useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductoPicker } from "@/components/ProductoPicker";
import { formatCOP } from "@/utils/formatCurrency";
import { logError } from "@/utils/errorLogger";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2, Banknote, Utensils, Image as ImageIcon } from "lucide-react";

type CartItem = {
  producto_id: string;
  nombre: string;
  precio: number;
  foto_url: string | null;
  cantidad: number;
};

export default function CajeroMostrador() {
  const { user } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cobrarOpen, setCobrarOpen] = useState(false);
  const [mesaOpen, setMesaOpen] = useState(false);
  const [nombreCliente, setNombreCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "debito" | "credito" | "nequi" | "daviplata">("efectivo");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [ordenDestino, setOrdenDestino] = useState<string>("");
  const [numeroSilla, setNumeroSilla] = useState<string>("1");

  const total = useMemo(() => cart.reduce((s, i) => s + i.precio * i.cantidad, 0), [cart]);

  const { data: ordenesAbiertas } = useQuery({
    queryKey: ["ordenes-abiertas-mostrador"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordenes")
        .select("id, numero_orden, nombre_cliente, total, estado, mesas(numero, salones(nombre))")
        .neq("estado", "facturada")
        .order("numero_orden", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const agregarProducto = async (id: string) => {
    const existente = cart.find((c) => c.producto_id === id);
    if (existente) {
      setCart(cart.map((c) => (c.producto_id === id ? { ...c, cantidad: c.cantidad + 1 } : c)));
      return;
    }
    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre, precio, foto_url")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      toast.error("No se pudo agregar el producto");
      return;
    }
    setCart((prev) => [
      ...prev,
      { producto_id: data.id, nombre: data.nombre, precio: Number(data.precio), foto_url: data.foto_url, cantidad: 1 },
    ]);
  };

  const cambiarCantidad = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.producto_id === id ? { ...c, cantidad: c.cantidad + delta } : c))
        .filter((c) => c.cantidad > 0)
    );
  };

  const imprimirPDF = async (facturaId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("generar-factura-pdf", {
        body: { facturaId, enviarCorreo: false },
      });
      if (error) throw error;
      const ventana = window.open("", "_blank");
      if (ventana) {
        ventana.document.write(data.html);
        ventana.document.close();
        setTimeout(() => ventana.print(), 500);
      }
    } catch (e) {
      logError("Error al generar PDF de factura mostrador:", e);
      toast.error("Factura creada, pero no se pudo imprimir");
    }
  };

  const cobrarMutation = useMutation({
    mutationFn: async () => {
      const { data: factura, error } = await supabase
        .from("facturas")
        .insert({
          orden_id: null,
          cajero_id: user?.id,
          nombre_cliente: nombreCliente.trim() || "Cliente mostrador",
          subtotal: total,
          impuestos: 0,
          propina: 0,
          total,
          metodo_pago: metodoPago,
          referencia_pago: referenciaPago.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;

      const items = cart.map((c) => ({
        factura_id: factura.id,
        producto_nombre: c.nombre,
        cantidad: c.cantidad,
        precio_unitario: c.precio,
        subtotal: c.precio * c.cantidad,
      }));
      const { error: itemsError } = await supabase.from("factura_items").insert(items);
      if (itemsError) throw itemsError;

      return factura;
    },
    onSuccess: (factura) => {
      toast.success(`Factura #${factura.consecutivo} generada`, { description: formatCOP(Number(factura.total)) });
      queryClient.invalidateQueries({ queryKey: ["estadisticas-cajero-hoy"] });
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      imprimirPDF(factura.id);
      setCart([]);
      setNombreCliente("");
      setReferenciaPago("");
      setCobrarOpen(false);
    },
    onError: (e) => {
      logError("Error al cobrar venta de mostrador:", e);
      toast.error("Error al generar la factura");
    },
  });

  const agregarAMesaMutation = useMutation({
    mutationFn: async () => {
      if (!ordenDestino) throw new Error("Selecciona una orden");
      const silla = Math.max(1, parseInt(numeroSilla) || 1);

      const items = cart.map((c) => ({
        orden_id: ordenDestino,
        producto_id: c.producto_id,
        numero_silla: silla,
        cantidad: c.cantidad,
        precio_unitario: c.precio,
        subtotal: c.precio * c.cantidad,
      }));
      const { error } = await supabase.from("orden_productos").insert(items);
      if (error) throw error;

      const { data: productos } = await supabase
        .from("orden_productos")
        .select("subtotal")
        .eq("orden_id", ordenDestino);
      const nuevoTotal = (productos || []).reduce((s, p) => s + Number(p.subtotal), 0);
      await supabase.from("ordenes").update({ total: nuevoTotal }).eq("id", ordenDestino);
    },
    onSuccess: () => {
      toast.success("Productos agregados a la cuenta");
      queryClient.invalidateQueries({ queryKey: ["ordenes-abiertas-mostrador"] });
      queryClient.invalidateQueries({ queryKey: ["ordenes-entregadas"] });
      setCart([]);
      setOrdenDestino("");
      setMesaOpen(false);
    },
    onError: (e) => {
      logError("Error al agregar productos a la orden:", e);
      toast.error("Error al agregar a la cuenta");
    },
  });

  if (isLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  if (!roles?.includes("cajero")) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/cajero")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Venta en Mostrador</h1>
            <p className="text-sm text-muted-foreground">Cobra de inmediato o agrega a la cuenta de una mesa</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>Toca un producto para agregarlo a la venta</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductoPicker value="" onChange={agregarProducto} />
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Venta actual
              {cart.length > 0 && <Badge variant="secondary">{cart.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Aún no has agregado productos</p>
            ) : (
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.producto_id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {item.foto_url ? (
                        <img src={item.foto_url} alt={item.nombre} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.nombre}</p>
                      <p className="text-xs text-muted-foreground">{formatCOP(item.precio)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => cambiarCantidad(item.producto_id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{item.cantidad}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => cambiarCantidad(item.producto_id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">{formatCOP(total)}</span>
            </div>

            <div className="grid gap-2">
              <Button disabled={cart.length === 0} onClick={() => setCobrarOpen(true)}>
                <Banknote className="w-4 h-4 mr-2" />
                Cobrar ahora
              </Button>
              <Button variant="secondary" disabled={cart.length === 0} onClick={() => setMesaOpen(true)}>
                <Utensils className="w-4 h-4 mr-2" />
                Agregar a cuenta de mesa
              </Button>
              <Button variant="ghost" disabled={cart.length === 0} onClick={() => setCart([])}>
                <Trash2 className="w-4 h-4 mr-2" />
                Vaciar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={cobrarOpen} onOpenChange={setCobrarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cobrar venta de mostrador</DialogTitle>
            <DialogDescription>Total a pagar: {formatCOP(total)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del cliente (opcional)</Label>
              <Input value={nombreCliente} maxLength={100} onChange={(e) => setNombreCliente(e.target.value)} placeholder="Cliente mostrador" />
            </div>
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={metodoPago} onValueChange={(v: any) => setMetodoPago(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="debito">Tarjeta débito</SelectItem>
                  <SelectItem value="credito">Tarjeta crédito</SelectItem>
                  <SelectItem value="nequi">Nequi</SelectItem>
                  <SelectItem value="daviplata">Daviplata</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {metodoPago !== "efectivo" && (
              <div className="space-y-2">
                <Label>Referencia de pago (opcional)</Label>
                <Input value={referenciaPago} maxLength={100} onChange={(e) => setReferenciaPago(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCobrarOpen(false)}>Cancelar</Button>
            <Button onClick={() => cobrarMutation.mutate()} disabled={cobrarMutation.isPending || total <= 0}>
              {cobrarMutation.isPending ? "Procesando..." : `Cobrar ${formatCOP(total)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mesaOpen} onOpenChange={setMesaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar a cuenta de mesa</DialogTitle>
            <DialogDescription>Los productos se sumarán a una orden abierta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Orden / Mesa</Label>
              <Select value={ordenDestino} onValueChange={setOrdenDestino}>
                <SelectTrigger><SelectValue placeholder="Selecciona una orden abierta" /></SelectTrigger>
                <SelectContent>
                  {(ordenesAbiertas || []).map((o: any) => (
                    <SelectItem key={o.id} value={o.id}>
                      #{o.numero_orden} · {o.mesas ? `Mesa ${o.mesas.numero}${o.mesas.salones ? ` (${o.mesas.salones.nombre})` : ""}` : o.nombre_cliente || "Domicilio"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(ordenesAbiertas || []).length === 0 && (
                <p className="text-xs text-muted-foreground">No hay órdenes abiertas en este momento.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Número de silla</Label>
              <Input type="number" min={1} value={numeroSilla} onChange={(e) => setNumeroSilla(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMesaOpen(false)}>Cancelar</Button>
            <Button onClick={() => agregarAMesaMutation.mutate()} disabled={!ordenDestino || agregarAMesaMutation.isPending}>
              {agregarAMesaMutation.isPending ? "Agregando..." : "Agregar a la cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
