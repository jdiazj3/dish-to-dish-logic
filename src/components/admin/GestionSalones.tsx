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
import { Plus, Pencil, Trash2, DoorOpen } from "lucide-react";
import { toast } from "sonner";

export function GestionSalones() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSalon, setEditingSalon] = useState<any>(null);
  const [nombre, setNombre] = useState("");
  const [sedeId, setSedeId] = useState("");
  const queryClient = useQueryClient();

  const { data: sedes } = useQuery({
    queryKey: ['sedes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sedes')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });

  const { data: salones, isLoading } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: async (newSalon: { nombre: string; sede_id: string }) => {
      const { error } = await supabase
        .from('salones')
        .insert(newSalon);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salones'] });
      toast.success("Salón creado exitosamente");
      resetForm();
    },
    onError: () => {
      toast.error("Error al crear el salón");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from('salones')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salones'] });
      toast.success("Salón actualizado");
      resetForm();
    },
    onError: () => {
      toast.error("Error al actualizar el salón");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('salones')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salones'] });
      toast.success("Salón eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar el salón");
    },
  });

  const resetForm = () => {
    setNombre("");
    setSedeId("");
    setEditingSalon(null);
    setDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !sedeId) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (editingSalon) {
      updateMutation.mutate({ id: editingSalon.id, nombre, sede_id: sedeId });
    } else {
      createMutation.mutate({ nombre, sede_id: sedeId });
    }
  };

  const handleEdit = (salon: any) => {
    setEditingSalon(salon);
    setNombre(salon.nombre);
    setSedeId(salon.sede_id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este salón?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DoorOpen className="w-5 h-5" />
              Gestión de Salones
            </CardTitle>
            <CardDescription>Administra los salones de cada sede</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Salón
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSalon ? "Editar Salón" : "Nuevo Salón"}</DialogTitle>
                <DialogDescription>
                  {editingSalon ? "Modifica los datos del salón" : "Crea un nuevo salón"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Salón</Label>
                    <Input
                      id="nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Salón Principal"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sede">Sede</Label>
                    <Select value={sedeId} onValueChange={setSedeId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una sede" />
                      </SelectTrigger>
                      <SelectContent>
                        {sedes?.map((sede) => (
                          <SelectItem key={sede.id} value={sede.id}>
                            {sede.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingSalon ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : salones && salones.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salones.map((salon) => (
                <TableRow key={salon.id}>
                  <TableCell className="font-medium">{salon.nombre}</TableCell>
                  <TableCell>{salon.sedes?.nombre}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEdit(salon)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(salon.id)}
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
          <p className="text-muted-foreground">No hay salones registrados</p>
        )}
      </CardContent>
    </Card>
  );
}
