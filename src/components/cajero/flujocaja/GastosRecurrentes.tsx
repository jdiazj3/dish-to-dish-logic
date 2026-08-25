import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/utils/formatCurrency";
import { format, differenceInDays, isPast, isToday, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Calendar, Pencil, Trash2, Wallet, History, AlertTriangle, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

interface GastoRecurrente {
  id: string;
  nombre: string;
  monto_estimado: number;
  frecuencia: string;
  dia_pago: number | null;
  proximo_pago: string | null;
  activo: boolean;
  notas: string | null;
  categoria_gasto: {
    id: string;
    nombre: string;
  } | null;
}

interface CategoriaGasto {
  id: string;
  nombre: string;
}

const NONE = "none";

export function GastosRecurrentes() {
  const { user } = useAuth();
  const { data: roles } = useUserRole(user?.id);
  const isAdmin = roles?.includes('admin_total') || roles?.includes('admin_sede');
  const puedePagar = isAdmin || roles?.includes('cajero');
  const puedeGestionar = puedePagar;

  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoRecurrente | null>(null);

  // Form state
  const [nombre, setNombre] = useState("");
  const [montoEstimado, setMontoEstimado] = useState("");
  const [frecuencia, setFrecuencia] = useState("mensual");
  const [diaPago, setDiaPago] = useState("");
  const [proximoPago, setProximoPago] = useState("");
  const [categoriaId, setCategoriaId] = useState(NONE);
  const [notas, setNotas] = useState("");

  // Pago state
  const [pagoGasto, setPagoGasto] = useState<GastoRecurrente | null>(null);
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoCuenta, setPagoCuenta] = useState(NONE);
  const [pagoFecha, setPagoFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [pagoNotas, setPagoNotas] = useState("");

  // Historial state
  const [historialGasto, setHistorialGasto] = useState<GastoRecurrente | null>(null);

  const { data: gastos = [], isLoading } = useQuery({
    queryKey: ['gastos-recurrentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastos_recurrentes')
        .select(`
          *,
          categoria_gasto:categorias_gastos(id, nombre)
        `)
        .eq('activo', true)
        .order('proximo_pago', { ascending: true });

      if (error) throw error;
      return data as unknown as GastoRecurrente[];
    }
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-gastos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_gastos')
        .select('id, nombre')
        .eq('activa', true)
        .order('nombre');

      if (error) throw error;
      return data as CategoriaGasto[];
    }
  });

  const { data: cuentas = [] } = useQuery({
    queryKey: ['cuentas-flujo-activas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuentas_flujo')
        .select('id, nombre, saldo_actual')
        .eq('activa', true)
        .order('nombre');
      if (error) throw error;
      return data;
    }
  });

  const { data: pagos = [], isLoading: loadingPagos } = useQuery({
    queryKey: ['pagos-gasto-programado', historialGasto?.id],
    enabled: !!historialGasto?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos_gastos_programados')
        .select('id, monto_pagado, fecha_pago, periodo, notas, cuenta:cuentas_flujo(nombre)')
        .eq('gasto_recurrente_id', historialGasto!.id)
        .order('fecha_pago', { ascending: false });
      if (error) throw error;
      return data as unknown as Array<{
        id: string;
        monto_pagado: number;
        fecha_pago: string;
        periodo: string | null;
        notas: string | null;
        cuenta: { nombre: string } | null;
      }>;
    }
  });

  const guardarMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre,
        monto_estimado: parseFloat(montoEstimado),
        frecuencia,
        dia_pago: diaPago ? parseInt(diaPago) : null,
        proximo_pago: proximoPago || null,
        categoria_gasto_id: categoriaId === NONE ? null : categoriaId,
        notas: notas || null
      };

      if (editingGasto) {
        const { error } = await supabase
          .from('gastos_recurrentes')
          .update(payload)
          .eq('id', editingGasto.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gastos_recurrentes')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos-recurrentes'] });
      toast.success(editingGasto ? "Gasto actualizado" : "Gasto programado creado");
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("Error al guardar el gasto");
    }
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gastos_recurrentes')
        .update({ activo: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos-recurrentes'] });
      toast.success("Gasto eliminado");
    }
  });

  const pagarMutation = useMutation({
    mutationFn: async () => {
      if (!pagoGasto) throw new Error("Sin gasto");
      const { error } = await supabase.rpc('pagar_gasto_programado', {
        _gasto_id: pagoGasto.id,
        _monto: parseFloat(pagoMonto),
        _cuenta_id: pagoCuenta === NONE ? undefined : pagoCuenta,
        _fecha_pago: pagoFecha,
        _notas: pagoNotas || undefined
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos-recurrentes'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos-caja'] });
      queryClient.invalidateQueries({ queryKey: ['flujo-caja-resumen'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas-flujo'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas-flujo-activas'] });
      queryClient.invalidateQueries({ queryKey: ['pagos-gasto-programado'] });
      toast.success("Pago registrado y próxima fecha actualizada");
      setPagoGasto(null);
    },
    onError: (e: any) => {
      toast.error(e?.message || "Error al registrar el pago");
    }
  });

  const resetForm = () => {
    setNombre("");
    setMontoEstimado("");
    setFrecuencia("mensual");
    setDiaPago("");
    setProximoPago("");
    setCategoriaId(NONE);
    setNotas("");
    setEditingGasto(null);
  };

  const handleEdit = (gasto: GastoRecurrente) => {
    setEditingGasto(gasto);
    setNombre(gasto.nombre);
    setMontoEstimado(gasto.monto_estimado.toString());
    setFrecuencia(gasto.frecuencia);
    setDiaPago(gasto.dia_pago?.toString() || "");
    setProximoPago(gasto.proximo_pago || "");
    setCategoriaId(gasto.categoria_gasto?.id || NONE);
    setNotas(gasto.notas || "");
    setDialogOpen(true);
  };

  const abrirPago = (gasto: GastoRecurrente) => {
    setPagoGasto(gasto);
    setPagoMonto(gasto.monto_estimado.toString());
    setPagoCuenta(NONE);
    setPagoFecha(format(new Date(), "yyyy-MM-dd"));
    setPagoNotas("");
  };

  const esVencido = (p: string | null) => !!p && isPast(new Date(p)) && !isToday(new Date(p));
  const esProximo = (p: string | null) => {
    if (!p) return false;
    const f = new Date(p);
    return !esVencido(p) && f <= addDays(new Date(), 7);
  };

  const vencidos = gastos.filter(g => esVencido(g.proximo_pago));
  const proximos = gastos.filter(g => esProximo(g.proximo_pago));
  const totalVencido = vencidos.reduce((s, g) => s + Number(g.monto_estimado), 0);
  const totalProximo = proximos.reduce((s, g) => s + Number(g.monto_estimado), 0);
  const totalMensual = gastos
    .filter(g => g.frecuencia === 'mensual')
    .reduce((s, g) => s + Number(g.monto_estimado), 0);

  const getEstadoPago = (proximoPago: string | null) => {
    if (!proximoPago) return <Badge variant="outline">Sin fecha</Badge>;

    const fecha = new Date(proximoPago);

    if (isToday(fecha)) {
      return <Badge variant="destructive">Hoy</Badge>;
    }
    if (esVencido(proximoPago)) {
      return <Badge variant="destructive">Vencido {Math.abs(differenceInDays(fecha, new Date()))}d</Badge>;
    }

    const diasRestantes = differenceInDays(fecha, new Date()) + 1;

    if (diasRestantes <= 3) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En {diasRestantes} días</Badge>;
    }

    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">En {diasRestantes} días</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Vencidos ({vencidos.length})</p>
              <p className="text-xl font-bold">{formatCOP(totalVencido)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <CalendarClock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Por pagar (7 días) ({proximos.length})</p>
              <p className="text-xl font-bold">{formatCOP(totalProximo)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Compromiso mensual</p>
              <p className="text-xl font-bold">{formatCOP(totalMensual)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Gastos Programados</CardTitle>
              <CardDescription>
                {puedeGestionar
                  ? "Programa pagos periódicos, regístralos al pagarlos y la próxima fecha se calcula sola"
                  : "Puedes registrar el pago de los gastos programados por el administrador"}
              </CardDescription>
            </div>
            {puedeGestionar && (
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Gasto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingGasto ? "Editar Gasto" : "Nuevo Gasto Programado"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        placeholder="Ej: Arriendo local"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Monto Estimado *</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={montoEstimado}
                          onChange={(e) => setMontoEstimado(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Frecuencia</Label>
                        <Select value={frecuencia} onValueChange={setFrecuencia}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="quincenal">Quincenal</SelectItem>
                            <SelectItem value="mensual">Mensual</SelectItem>
                            <SelectItem value="bimestral">Bimestral</SelectItem>
                            <SelectItem value="trimestral">Trimestral</SelectItem>
                            <SelectItem value="semestral">Semestral</SelectItem>
                            <SelectItem value="anual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Día de Pago</Label>
                        <Input
                          type="number"
                          placeholder="1-31"
                          min="1"
                          max="31"
                          value={diaPago}
                          onChange={(e) => setDiaPago(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Próximo Pago</Label>
                        <Input
                          type="date"
                          value={proximoPago}
                          onChange={(e) => setProximoPago(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Select value={categoriaId} onValueChange={setCategoriaId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Sin categoría</SelectItem>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notas</Label>
                      <Input
                        placeholder="Notas adicionales..."
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => guardarMutation.mutate()} disabled={!nombre || !montoEstimado || guardarMutation.isPending}>
                      {editingGasto ? "Actualizar" : "Crear"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : gastos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay gastos programados</p>
              <p className="text-sm">Programa tus pagos recurrentes para recibir alertas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Monto Est.</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Próximo Pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gastos.map((gasto) => (
                    <TableRow key={gasto.id} className={esVencido(gasto.proximo_pago) ? "bg-destructive/5" : undefined}>
                      <TableCell className="font-medium">{gasto.nombre}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {gasto.categoria_gasto?.nombre || '-'}
                      </TableCell>
                      <TableCell>{formatCOP(gasto.monto_estimado)}</TableCell>
                      <TableCell className="capitalize">{gasto.frecuencia}</TableCell>
                      <TableCell>
                        {gasto.proximo_pago
                          ? format(new Date(gasto.proximo_pago), "dd MMM yyyy", { locale: es })
                          : '-'}
                      </TableCell>
                      <TableCell>{getEstadoPago(gasto.proximo_pago)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          {puedePagar && (
                            <Button size="sm" onClick={() => abrirPago(gasto)}>
                              <Wallet className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" title="Historial de pagos" onClick={() => setHistorialGasto(gasto)}>
                            <History className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(gasto)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('¿Eliminar este gasto programado?')) {
                                    eliminarMutation.mutate(gasto.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de pago */}
      <Dialog open={!!pagoGasto} onOpenChange={(o) => !o && setPagoGasto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              {pagoGasto?.nombre} · se creará una salida en el flujo de caja y se recalculará la próxima fecha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto pagado *</Label>
                <Input
                  type="number"
                  value={pagoMonto}
                  onChange={(e) => setPagoMonto(e.target.value)}
                />
                {pagoGasto && parseFloat(pagoMonto || "0") !== Number(pagoGasto.monto_estimado) && (
                  <p className="text-xs text-muted-foreground">
                    Estimado: {formatCOP(pagoGasto.monto_estimado)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Fecha de pago</Label>
                <Input type="date" value={pagoFecha} onChange={(e) => setPagoFecha(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cuenta de salida</Label>
              <Select value={pagoCuenta} onValueChange={setPagoCuenta}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin cuenta específica</SelectItem>
                  {cuentas.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} · {formatCOP(c.saldo_actual)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Ej: factura 1234, pago parcial..."
                value={pagoNotas}
                onChange={(e) => setPagoNotas(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagoGasto(null)}>Cancelar</Button>
            <Button
              onClick={() => pagarMutation.mutate()}
              disabled={!pagoMonto || parseFloat(pagoMonto) <= 0 || pagarMutation.isPending}
            >
              {pagarMutation.isPending ? "Registrando..." : "Confirmar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Historial de pagos */}
      <Dialog open={!!historialGasto} onOpenChange={(o) => !o && setHistorialGasto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historial de pagos</DialogTitle>
            <DialogDescription>{historialGasto?.nombre}</DialogDescription>
          </DialogHeader>
          {loadingPagos ? (
            <div className="py-6 text-center">Cargando...</div>
          ) : pagos.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">Aún no hay pagos registrados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{format(new Date(p.fecha_pago), "dd MMM yyyy", { locale: es })}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.periodo ? format(new Date(p.periodo), "dd MMM yyyy", { locale: es }) : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.cuenta?.nombre || '-'}</TableCell>
                    <TableCell className="font-medium">{formatCOP(p.monto_pagado)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.notas || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
