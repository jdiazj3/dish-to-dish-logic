import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, TableIcon } from "lucide-react";
import { toast } from "sonner";

export function GestionMesas() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<any>(null);
  const [numero, setNumero] = useState("");
  const [capacidadSillas, setCapacidadSillas] = useState("");
  const [salonId, setSalonId] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [filterSalon, setFilterSalon] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: salones } = useQuery({
    queryKey: ['salones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salones')
        .select('*, sedes(nombre)')
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });

  const { data: mesas, isLoading } = useQuery({
    queryKey: ['mesas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mesas')
        .select('*, salones(nombre, sedes(nombre))')
        .order('numero');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newMesa: { numero: number; capacidad_sillas: number; salon_id: string; disponible: boolean }) => {
      const { error } = await supabase
        .from('mesas')
        .insert(newMesa);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      toast.success("Mesa creada exitosamente");
      resetForm();
    },
    onError: () => {
      toast.error("Error al crear la mesa");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('mesas')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      toast.success("Mesa actualizada");
      resetForm();
    },
    onError: () => {
      toast.error("Error al actualizar la mesa");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mesas')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      toast.success("Mesa eliminada");
    },
    onError: () => {
      toast.error("Error al eliminar la mesa");
    },
  });

  const toggleDisponibilidadMutation = useMutation({
    mutationFn: async ({ id, disponible }: { id: string; disponible: boolean }) => {
      const { error } = await supabase
        .from('mesas')
        .update({ disponible })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      toast.success("Disponibilidad actualizada");
    },
    onError: () => {
      toast.error("Error al actualizar disponibilidad");
    },
  });

  const resetForm = () => {
    setNumero("");
    setCapacidadSillas("");
    setSalonId("");
    setDisponible(true);
    setEditingMesa(null);
    setDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim() || !capacidadSillas || !salonId) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    const mesaData = {
      numero: parseInt(numero),
      capacidad_sillas: parseInt(capacidadSillas),
      salon_id: salonId,
      disponible,
    };

    if (editingMesa) {
      updateMutation.mutate({ id: editingMesa.id, ...mesaData });
    } else {
      createMutation.mutate(mesaData);
    }
  };

  const handleEdit = (mesa: any) => {
    setEditingMesa(mesa);
    setNumero(mesa.numero.toString());
    setCapacidadSillas(mesa.capacidad_sillas.toString());
    setSalonId(mesa.salon_id);
    setDisponible(mesa.disponible);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta mesa?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredMesas = mesas?.filter(mesa => 
    filterSalon === "all" || mesa.salon_id === filterSalon
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="w-5 h-5" />
              Gestión de Mesas
            </CardTitle>
            <CardDescription>Administra las mesas de cada salón</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Mesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMesa ? "Editar Mesa" : "Nueva Mesa"}</DialogTitle>
                <DialogDescription>
                  {editingMesa ? "Modifica los datos de la mesa" : "Crea una nueva mesa"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número de Mesa</Label>
                    <Input
                      id="numero"
                      type="number"
                      min="1"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="Ej: 1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacidad">Capacidad de Sillas</Label>
                    <Input
                      id="capacidad"
                      type="number"
                      min="1"
                      value={capacidadSillas}
                      onChange={(e) => setCapacidadSillas(e.target.value)}
                      placeholder="Ej: 4"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salon">Salón</Label>
                    <Select value={salonId} onValueChange={setSalonId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un salón" />
                      </SelectTrigger>
                      <SelectContent>
                        {salones?.map((salon) => (
                          <SelectItem key={salon.id} value={salon.id}>
                            {salon.nombre} - {salon.sedes?.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="disponible">Disponible</Label>
                    <Switch
                      id="disponible"
                      checked={disponible}
                      onCheckedChange={setDisponible}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingMesa ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="filter">Filtrar por Salón</Label>
          <Select value={filterSalon} onValueChange={setFilterSalon}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Todos los salones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los salones</SelectItem>
              {salones?.map((salon) => (
                <SelectItem key={salon.id} value={salon.id}>
                  {salon.nombre} - {salon.sedes?.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : filteredMesas && filteredMesas.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Salón</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMesas.map((mesa) => (
                <TableRow key={mesa.id}>
                  <TableCell className="font-medium">Mesa {mesa.numero}</TableCell>
                  <TableCell>{mesa.capacidad_sillas} sillas</TableCell>
                  <TableCell>{mesa.salones?.nombre}</TableCell>
                  <TableCell>{mesa.salones?.sedes?.nombre}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={mesa.disponible}
                        onCheckedChange={(checked) => 
                          toggleDisponibilidadMutation.mutate({ id: mesa.id, disponible: checked })
                        }
                      />
                      <Badge variant={mesa.disponible ? "default" : "secondary"}>
                        {mesa.disponible ? "Disponible" : "No disponible"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEdit(mesa)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(mesa.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground">No hay mesas registradas</p>
        )}
      </CardContent>
    </Card>
  );
}
