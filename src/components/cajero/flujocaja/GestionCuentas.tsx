import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCOP } from "@/utils/formatCurrency";
import { Plus, Pencil, Banknote, Smartphone, Building2, Wallet } from "lucide-react";

interface Cuenta {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  saldo_inicial: number;
  saldo_actual: number;
  activa: boolean;
  color: string;
  icono: string;
}

const iconMap: Record<string, React.ReactNode> = {
  banknote: <Banknote className="h-5 w-5" />,
  smartphone: <Smartphone className="h-5 w-5" />,
  "building-2": <Building2 className="h-5 w-5" />,
  wallet: <Wallet className="h-5 w-5" />,
};

const tipoLabels: Record<string, string> = {
  efectivo: "Efectivo",
  billetera_digital: "Billetera Digital",
  banco: "Cuenta Bancaria",
};

export function GestionCuentas() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<Cuenta | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "efectivo",
    descripcion: "",
    saldo_inicial: "",
    color: "#6366f1",
    icono: "wallet",
  });

  const { data: cuentas = [], isLoading } = useQuery({
    queryKey: ['cuentas-flujo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuentas_flujo')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      return data as Cuenta[];
    }
  });

  const crearMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: formData.nombre,
        tipo: formData.tipo,
        descripcion: formData.descripcion || null,
        saldo_inicial: parseFloat(formData.saldo_inicial) || 0,
        saldo_actual: parseFloat(formData.saldo_inicial) || 0,
        color: formData.color,
        icono: formData.icono,
      };

      if (editingCuenta) {
        const { error } = await supabase
          .from('cuentas_flujo')
          .update(payload)
          .eq('id', editingCuenta.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cuentas_flujo')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-flujo'] });
      toast.success(editingCuenta ? "Cuenta actualizada" : "Cuenta creada");
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error:", error);
      toast.error("Error al guardar la cuenta");
    }
  });

  const toggleActivaMutation = useMutation({
    mutationFn: async ({ id, activa }: { id: string; activa: boolean }) => {
      const { error } = await supabase
        .from('cuentas_flujo')
        .update({ activa: !activa })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-flujo'] });
      toast.success("Estado actualizado");
    }
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      tipo: "efectivo",
      descripcion: "",
      saldo_inicial: "",
      color: "#6366f1",
      icono: "wallet",
    });
    setEditingCuenta(null);
  };

  const handleEdit = (cuenta: Cuenta) => {
    setEditingCuenta(cuenta);
    setFormData({
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      descripcion: cuenta.descripcion || "",
      saldo_inicial: cuenta.saldo_inicial.toString(),
      color: cuenta.color,
      icono: cuenta.icono,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    crearMutation.mutate();
  };

  const saldoTotal = cuentas.filter(c => c.activa).reduce((sum, c) => sum + Number(c.saldo_actual), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cuentas y Medios de Pago</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Saldo total: <span className="font-semibold text-foreground">{formatCOP(saldoTotal)}</span>
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCuenta ? "Editar Cuenta" : "Nueva Cuenta"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Nequi Personal"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="billetera_digital">Billetera Digital</SelectItem>
                    <SelectItem value="banco">Cuenta Bancaria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción opcional"
                />
              </div>

              <div className="space-y-2">
                <Label>Saldo Inicial</Label>
                <Input
                  type="number"
                  value={formData.saldo_inicial}
                  onChange={(e) => setFormData({ ...formData, saldo_inicial: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 p-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icono</Label>
                  <Select value={formData.icono} onValueChange={(v) => setFormData({ ...formData, icono: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wallet">Billetera</SelectItem>
                      <SelectItem value="banknote">Efectivo</SelectItem>
                      <SelectItem value="smartphone">Celular</SelectItem>
                      <SelectItem value="building-2">Banco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={crearMutation.isPending}>
                {editingCuenta ? "Guardar Cambios" : "Crear Cuenta"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando...</div>
        ) : cuentas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No hay cuentas configuradas</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cuentas.map((cuenta) => (
              <div
                key={cuenta.id}
                className={`relative p-4 rounded-lg border ${!cuenta.activa ? 'opacity-50' : ''}`}
                style={{ borderLeftWidth: 4, borderLeftColor: cuenta.color }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div style={{ color: cuenta.color }}>
                      {iconMap[cuenta.icono] || <Wallet className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{cuenta.nombre}</p>
                      <Badge variant="outline" className="text-xs">
                        {tipoLabels[cuenta.tipo] || cuenta.tipo}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(cuenta)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-2xl font-bold mt-3" style={{ color: cuenta.color }}>
                  {formatCOP(cuenta.saldo_actual)}
                </p>
                {cuenta.descripcion && (
                  <p className="text-xs text-muted-foreground mt-1">{cuenta.descripcion}</p>
                )}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-2 text-xs"
                  onClick={() => toggleActivaMutation.mutate({ id: cuenta.id, activa: cuenta.activa })}
                >
                  {cuenta.activa ? "Desactivar" : "Activar"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
