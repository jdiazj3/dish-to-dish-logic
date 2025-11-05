import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Building2, Upload, X } from "lucide-react";
import { toast } from "sonner";

const DIAS_SEMANA = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miércoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sábado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

export function GestionSedes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSede, setEditingSede] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    correo: "",
    horario_apertura: "",
    horario_cierre: "",
    notas: "",
    activa: true,
  });
  const [diasOperacion, setDiasOperacion] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: sedes, isLoading } = useQuery({
    queryKey: ['sedes-completas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sedes')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });

  const crearSedeMutation = useMutation({
    mutationFn: async (data: typeof formData & { dias: string[] }) => {
      const { data: sede, error } = await supabase
        .from('sedes')
        .insert({
          nombre: data.nombre,
          direccion: data.direccion || null,
          telefono: data.telefono || null,
          correo: data.correo || null,
          horario_apertura: data.horario_apertura || null,
          horario_cierre: data.horario_cierre || null,
          dias_operacion: data.dias.length > 0 ? data.dias : null,
          notas: data.notas || null,
          activa: data.activa,
        })
        .select()
        .single();

      if (error) throw error;

      // Subir logo si existe
      if (logoFile && sede) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${sede.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('logos-sedes')
          .upload(fileName, logoFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('logos-sedes')
            .getPublicUrl(fileName);

          await supabase
            .from('sedes')
            .update({ logo_url: publicUrl })
            .eq('id', sede.id);
        }
      }

      return sede;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedes-completas'] });
      queryClient.invalidateQueries({ queryKey: ['sedes'] });
      toast.success("Sede creada exitosamente");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear la sede");
    },
  });

  const actualizarSedeMutation = useMutation({
    mutationFn: async ({ sedeId, data, dias }: { sedeId: string; data: typeof formData; dias: string[] }) => {
      const { error } = await supabase
        .from('sedes')
        .update({
          nombre: data.nombre,
          direccion: data.direccion || null,
          telefono: data.telefono || null,
          correo: data.correo || null,
          horario_apertura: data.horario_apertura || null,
          horario_cierre: data.horario_cierre || null,
          dias_operacion: dias.length > 0 ? dias : null,
          notas: data.notas || null,
          activa: data.activa,
        })
        .eq('id', sedeId);

      if (error) throw error;

      // Subir logo si existe
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${sedeId}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('logos-sedes')
          .upload(fileName, logoFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('logos-sedes')
            .getPublicUrl(fileName);

          await supabase
            .from('sedes')
            .update({ logo_url: publicUrl })
            .eq('id', sedeId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedes-completas'] });
      queryClient.invalidateQueries({ queryKey: ['sedes'] });
      toast.success("Sede actualizada");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar la sede");
    },
  });

  const eliminarSedeMutation = useMutation({
    mutationFn: async (sedeId: string) => {
      const { error } = await supabase
        .from('sedes')
        .delete()
        .eq('id', sedeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedes-completas'] });
      queryClient.invalidateQueries({ queryKey: ['sedes'] });
      toast.success("Sede eliminada");
    },
    onError: () => {
      toast.error("Error al eliminar la sede");
    },
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      direccion: "",
      telefono: "",
      correo: "",
      horario_apertura: "",
      horario_cierre: "",
      notas: "",
      activa: true,
    });
    setDiasOperacion([]);
    setLogoFile(null);
    setLogoPreview("");
    setEditingSede(null);
    setDialogOpen(false);
  };

  const handleEdit = (sede: any) => {
    setEditingSede(sede);
    setFormData({
      nombre: sede.nombre,
      direccion: sede.direccion || "",
      telefono: sede.telefono || "",
      correo: sede.correo || "",
      horario_apertura: sede.horario_apertura || "",
      horario_cierre: sede.horario_cierre || "",
      notas: sede.notas || "",
      activa: sede.activa ?? true,
    });
    setDiasOperacion(sede.dias_operacion || []);
    setLogoPreview(sede.logo_url || "");
    setDialogOpen(true);
  };

  const handleDelete = (sedeId: string) => {
    if (confirm("¿Estás seguro de eliminar esta sede?")) {
      eliminarSedeMutation.mutate(sedeId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error("El nombre de la sede es obligatorio");
      return;
    }

    if (editingSede) {
      actualizarSedeMutation.mutate({
        sedeId: editingSede.id,
        data: formData,
        dias: diasOperacion,
      });
    } else {
      crearSedeMutation.mutate({
        ...formData,
        dias: diasOperacion,
      });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDia = (dia: string) => {
    if (diasOperacion.includes(dia)) {
      setDiasOperacion(diasOperacion.filter(d => d !== dia));
    } else {
      setDiasOperacion([...diasOperacion, dia]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Gestión de Sedes
            </CardTitle>
            <CardDescription>Administra las sedes del restaurante</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Sede
            </Button>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSede ? "Editar Sede" : "Nueva Sede"}</DialogTitle>
                <DialogDescription>
                  {editingSede ? "Modifica los datos de la sede" : "Crea una nueva sede del restaurante"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6 py-4">
                  {/* Logo */}
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="w-24 h-24 rounded-lg">
                      <AvatarImage src={logoPreview} className="object-cover" />
                      <AvatarFallback className="rounded-lg">
                        <Building2 className="w-12 h-12" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex gap-2">
                      <Label htmlFor="logo" className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Subir Logo
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Información básica */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="nombre">Nombre de la Sede *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Sede Centro"
                        required
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="direccion">Dirección</Label>
                      <Input
                        id="direccion"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        placeholder="Calle 123 #45-67"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="(123) 456-7890"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="correo">Correo Electrónico</Label>
                      <Input
                        id="correo"
                        type="email"
                        value={formData.correo}
                        onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                        placeholder="sede@ejemplo.com"
                      />
                    </div>
                  </div>

                  {/* Horarios */}
                  <div className="space-y-3">
                    <Label>Horarios de Operación</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="apertura">Hora de Apertura</Label>
                        <Input
                          id="apertura"
                          type="time"
                          value={formData.horario_apertura}
                          onChange={(e) => setFormData({ ...formData, horario_apertura: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cierre">Hora de Cierre</Label>
                        <Input
                          id="cierre"
                          type="time"
                          value={formData.horario_cierre}
                          onChange={(e) => setFormData({ ...formData, horario_cierre: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Días de operación */}
                  <div className="space-y-3">
                    <Label>Días de Operación</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {DIAS_SEMANA.map((dia) => (
                        <div key={dia.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={dia.value}
                            checked={diasOperacion.includes(dia.value)}
                            onCheckedChange={() => toggleDia(dia.value)}
                          />
                          <Label htmlFor={dia.value} className="cursor-pointer text-sm">
                            {dia.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas / Observaciones</Label>
                    <Textarea
                      id="notas"
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      placeholder="Información adicional sobre la sede..."
                      rows={3}
                    />
                  </div>

                  {/* Estado */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="activa">Sede Activa</Label>
                      <p className="text-sm text-muted-foreground">
                        Desactiva si la sede está temporalmente cerrada
                      </p>
                    </div>
                    <Switch
                      id="activa"
                      checked={formData.activa}
                      onCheckedChange={(checked) => setFormData({ ...formData, activa: checked })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={crearSedeMutation.isPending || actualizarSedeMutation.isPending}
                  >
                    {crearSedeMutation.isPending || actualizarSedeMutation.isPending
                      ? "Guardando..."
                      : editingSede
                      ? "Actualizar Sede"
                      : "Crear Sede"}
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
        ) : sedes && sedes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sede</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sedes.map((sede) => (
                <TableRow key={sede.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 rounded-lg">
                        <AvatarImage src={sede.logo_url || ""} className="object-cover" />
                        <AvatarFallback className="rounded-lg">
                          <Building2 className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{sede.nombre}</p>
                        <p className="text-sm text-muted-foreground">{sede.direccion}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {sede.telefono && <p>{sede.telefono}</p>}
                      {sede.correo && <p className="text-muted-foreground">{sede.correo}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {sede.horario_apertura && sede.horario_cierre ? (
                        <p>{sede.horario_apertura} - {sede.horario_cierre}</p>
                      ) : (
                        <p className="text-muted-foreground">No especificado</p>
                      )}
                      {sede.dias_operacion && sede.dias_operacion.length > 0 && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {sede.dias_operacion.join(', ')}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sede.activa ? "default" : "secondary"}>
                      {sede.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEdit(sede)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(sede.id)}
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
          <p className="text-muted-foreground text-center py-8">
            No hay sedes registradas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
