import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { formatCOP } from "@/utils/formatCurrency";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, Loader2 } from "lucide-react";
import { logError } from "@/utils/errorLogger";

interface Cuenta {
  id: string;
  nombre: string;
  tipo: string;
  saldo_actual: number;
  color: string;
  activa: boolean;
}

interface Transferencia {
  id: string;
  cuenta_origen_id: string;
  cuenta_destino_id: string;
  monto: number;
  descripcion: string | null;
  notas: string | null;
  created_at: string;
  cuenta_origen: { nombre: string; color: string } | null;
  cuenta_destino: { nombre: string; color: string } | null;
  registrado_por_profile: { nombre: string; apellido: string } | null;
}

export function TransferenciasCuentas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [cuentaOrigenId, setCuentaOrigenId] = useState("");
  const [cuentaDestinoId, setCuentaDestinoId] = useState("");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [notas, setNotas] = useState("");

  const { data: cuentas = [] } = useQuery({
    queryKey: ['cuentas-flujo-activas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuentas_flujo')
        .select('*')
        .eq('activa', true)
        .order('nombre');
      
      if (error) throw error;
      return data as Cuenta[];
    }
  });

  const { data: transferencias = [], isLoading } = useQuery({
    queryKey: ['transferencias-cuentas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transferencias_cuentas')
        .select(`
          *,
          cuenta_origen:cuentas_flujo!transferencias_cuentas_cuenta_origen_id_fkey(nombre, color),
          cuenta_destino:cuentas_flujo!transferencias_cuentas_cuenta_destino_id_fkey(nombre, color),
          registrado_por_profile:profiles!transferencias_cuentas_registrado_por_fkey(nombre, apellido)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as unknown as Transferencia[];
    }
  });

  const transferirMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("No autenticado");
      
      const { error } = await supabase
        .from('transferencias_cuentas')
        .insert({
          cuenta_origen_id: cuentaOrigenId,
          cuenta_destino_id: cuentaDestinoId,
          monto: parseFloat(monto),
          descripcion: descripcion || null,
          notas: notas || null,
          registrado_por: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias-cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas-flujo'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas-flujo-activas'] });
      toast.success("Transferencia realizada correctamente");
      // Reset form
      setCuentaOrigenId("");
      setCuentaDestinoId("");
      setMonto("");
      setDescripcion("");
      setNotas("");
    },
    onError: (error) => {
      logError("Error al transferir:", error)
      toast.error("Error al realizar la transferencia");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cuentaOrigenId || !cuentaDestinoId) {
      toast.error("Selecciona las cuentas de origen y destino");
      return;
    }
    
    if (cuentaOrigenId === cuentaDestinoId) {
      toast.error("Las cuentas deben ser diferentes");
      return;
    }
    
    if (!monto || parseFloat(monto) <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    const cuentaOrigen = cuentas.find(c => c.id === cuentaOrigenId);
    if (cuentaOrigen && parseFloat(monto) > cuentaOrigen.saldo_actual) {
      toast.error("Saldo insuficiente en la cuenta de origen");
      return;
    }
    
    transferirMutation.mutate();
  };

  const cuentaOrigen = cuentas.find(c => c.id === cuentaOrigenId);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Formulario de transferencia */}
      <Card>
        <CardHeader>
          <CardTitle>Nueva Transferencia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cuenta Origen *</Label>
              <Select value={cuentaOrigenId} onValueChange={setCuentaOrigenId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.map((cuenta) => (
                    <SelectItem key={cuenta.id} value={cuenta.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cuenta.color }} />
                        {cuenta.nombre} - {formatCOP(cuenta.saldo_actual)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cuentaOrigen && (
                <p className="text-sm text-muted-foreground">
                  Saldo disponible: {formatCOP(cuentaOrigen.saldo_actual)}
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label>Cuenta Destino *</Label>
              <Select value={cuentaDestinoId} onValueChange={setCuentaDestinoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.filter(c => c.id !== cuentaOrigenId).map((cuenta) => (
                    <SelectItem key={cuenta.id} value={cuenta.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cuenta.color }} />
                        {cuenta.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input
                type="number"
                placeholder="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                min="0"
                step="100"
              />
              {monto && <p className="text-sm text-muted-foreground">{formatCOP(parseFloat(monto))}</p>}
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                placeholder="Ej: Paso a cuenta bancaria para pago proveedor"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Notas adicionales..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" disabled={transferirMutation.isPending}>
              {transferirMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Realizar Transferencia
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Historial de transferencias */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transferencias</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : transferencias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay transferencias registradas</div>
          ) : (
            <div className="space-y-3">
              {transferencias.map((t) => (
                <div key={t.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <span 
                      className="font-medium"
                      style={{ color: t.cuenta_origen?.color }}
                    >
                      {t.cuenta_origen?.nombre}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span 
                      className="font-medium"
                      style={{ color: t.cuenta_destino?.color }}
                    >
                      {t.cuenta_destino?.nombre}
                    </span>
                  </div>
                  <p className="text-lg font-bold mt-1">{formatCOP(t.monto)}</p>
                  {t.descripcion && (
                    <p className="text-sm text-muted-foreground">{t.descripcion}</p>
                  )}
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span>{format(new Date(t.created_at), "dd MMM yyyy HH:mm", { locale: es })}</span>
                    <span>
                      {t.registrado_por_profile 
                        ? `${t.registrado_por_profile.nombre} ${t.registrado_por_profile.apellido}`
                        : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
