import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/utils/formatCurrency";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Calendar, AlertCircle, Pencil, Trash2 } from "lucide-react";
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

export function GastosRecurrentes() {
  const { user } = useAuth();
  const { data: roles } = useUserRole(user?.id);
  const isAdmin = roles?.includes('admin_total') || roles?.includes('admin_sede');
  
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoRecurrente | null>(null);
  
  // Form state
  const [nombre, setNombre] = useState("");
  const [montoEstimado, setMontoEstimado] = useState("");
  const [frecuencia, setFrecuencia] = useState("mensual");
  const [diaPago, setDiaPago] = useState("");
  const [proximoPago, setProximoPago] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [notas, setNotas] = useState("");

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

  const guardarMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre,
        monto_estimado: parseFloat(montoEstimado),
        frecuencia,
        dia_pago: diaPago ? parseInt(diaPago) : null,
        proximo_pago: proximoPago || null,
        categoria_gasto_id: categoriaId || null,
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

  const resetForm = () => {
    setNombre("");
    setMontoEstimado("");
    setFrecuencia("mensual");
    setDiaPago("");
    setProximoPago("");
    setCategoriaId("");
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
    setCategoriaId(gasto.categoria_gasto?.id || "");
    setNotas(gasto.notas || "");
    setDialogOpen(true);
  };

  const getEstadoPago = (proximoPago: string | null) => {
    if (!proximoPago) return null;
    
    const fecha = new Date(proximoPago);
    
    if (isPast(fecha) && !isToday(fecha)) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    
    const diasRestantes = differenceInDays(fecha, new Date());
    
    if (isToday(fecha)) {
      return <Badge variant="destructive">Hoy</Badge>;
    }
    
    if (diasRestantes <= 3) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En {diasRestantes} días</Badge>;
    }
    
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">En {diasRestantes} días</Badge>;
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gastos Recurrentes</CardTitle>
          <CardDescription>Solo los administradores pueden gestionar gastos recurrentes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : gastos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay gastos programados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Monto Est.</TableHead>
                  <TableHead>Próximo Pago</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastos.map((gasto) => (
                  <TableRow key={gasto.id}>
                    <TableCell className="font-medium">{gasto.nombre}</TableCell>
                    <TableCell>{formatCOP(gasto.monto_estimado)}</TableCell>
                    <TableCell>
                      {gasto.proximo_pago 
                        ? format(new Date(gasto.proximo_pago), "dd MMM yyyy", { locale: es })
                        : '-'}
                    </TableCell>
                    <TableCell>{getEstadoPago(gasto.proximo_pago)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gastos Recurrentes</CardTitle>
            <CardDescription>Programa pagos periódicos y recibe alertas de vencimiento</CardDescription>
          </div>
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
                <DialogTitle>{editingGasto ? "Editar Gasto" : "Nuevo Gasto Recurrente"}</DialogTitle>
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
                <Button onClick={() => guardarMutation.mutate()} disabled={!nombre || !montoEstimado}>
                  {editingGasto ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Monto Est.</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Próximo Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gastos.map((gasto) => (
                <TableRow key={gasto.id}>
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
                    <div className="flex gap-1">
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
