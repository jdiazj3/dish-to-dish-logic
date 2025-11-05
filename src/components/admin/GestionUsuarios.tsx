import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Users, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/useUserRole";

const ROLES_DISPONIBLES: { value: AppRole; label: string }[] = [
  { value: "admin_total", label: "Administrador Total" },
  { value: "admin_sede", label: "Administrador de Sede" },
  { value: "cajero", label: "Cajero" },
  { value: "mesero", label: "Mesero" },
  { value: "cocina", label: "Cocina" },
];

const TURNOS = [
  { value: "mañana", label: "Mañana" },
  { value: "tarde", label: "Tarde" },
  { value: "noche", label: "Noche" },
];

export function GestionUsuarios() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    apellido: "",
    telefono: "",
    direccion: "",
    sede_id: "",
    turno: "",
  });
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios-completos'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*, sedes(nombre)')
        .order('nombre');
      
      if (error) throw error;

      // Obtener roles de cada usuario
      const userIds = profiles.map(p => p.id);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      return profiles.map(profile => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.id).map(r => r.role as AppRole) || [],
      }));
    },
  });

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

  const crearUsuarioMutation = useMutation({
    mutationFn: async (data: typeof formData & { roles: AppRole[] }) => {
      // Crear usuario con auth.admin
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        email_confirm: true,
        user_metadata: {
          nombre: data.nombre,
          apellido: data.apellido,
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      // Actualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono || null,
          direccion: data.direccion || null,
          sede_id: data.sede_id || null,
          turno: data.turno || null,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Subir foto si existe
      if (fotoFile) {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatares')
          .upload(fileName, fotoFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatares')
            .getPublicUrl(fileName);

          await supabase
            .from('profiles')
            .update({ foto_url: publicUrl })
            .eq('id', authData.user.id);
        }
      }

      // Asignar roles
      if (data.roles.length > 0) {
        const rolesData = data.roles.map(role => ({
          user_id: authData.user.id,
          role,
        }));

        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(rolesData);

        if (rolesError) throw rolesError;
      }

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-completos'] });
      toast.success("Usuario creado exitosamente");
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error al crear usuario:', error);
      toast.error(error.message || "Error al crear el usuario");
    },
  });

  const actualizarUsuarioMutation = useMutation({
    mutationFn: async ({ userId, data, roles }: { userId: string; data: typeof formData; roles: AppRole[] }) => {
      // Actualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono || null,
          direccion: data.direccion || null,
          sede_id: data.sede_id || null,
          turno: data.turno || null,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Subir foto si existe
      if (fotoFile) {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatares')
          .upload(fileName, fotoFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatares')
            .getPublicUrl(fileName);

          await supabase
            .from('profiles')
            .update({ foto_url: publicUrl })
            .eq('id', userId);
        }
      }

      // Actualizar roles: eliminar todos y volver a insertar
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roles.length > 0) {
        const rolesData = roles.map(role => ({
          user_id: userId,
          role,
        }));

        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(rolesData);

        if (rolesError) throw rolesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-completos'] });
      toast.success("Usuario actualizado");
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error al actualizar usuario:', error);
      toast.error("Error al actualizar el usuario");
    },
  });

  const eliminarUsuarioMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-completos'] });
      toast.success("Usuario eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar el usuario");
    },
  });

  const resetForm = () => {
    setFormData({
      email: "",
      nombre: "",
      apellido: "",
      telefono: "",
      direccion: "",
      sede_id: "",
      turno: "",
    });
    setSelectedRoles([]);
    setFotoFile(null);
    setFotoPreview("");
    setEditingUser(null);
    setDialogOpen(false);
  };

  const handleEdit = (usuario: any) => {
    setEditingUser(usuario);
    setFormData({
      email: usuario.correo || "",
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      telefono: usuario.telefono || "",
      direccion: usuario.direccion || "",
      sede_id: usuario.sede_id || "",
      turno: usuario.turno || "",
    });
    setSelectedRoles(usuario.roles || []);
    setFotoPreview(usuario.foto_url || "");
    setDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    if (confirm("¿Estás seguro de eliminar este usuario?")) {
      eliminarUsuarioMutation.mutate(userId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.apellido) {
      toast.error("Nombre y apellido son obligatorios");
      return;
    }

    if (!editingUser && !formData.email) {
      toast.error("El correo es obligatorio para crear usuarios");
      return;
    }

    if (editingUser) {
      actualizarUsuarioMutation.mutate({
        userId: editingUser.id,
        data: formData,
        roles: selectedRoles,
      });
    } else {
      crearUsuarioMutation.mutate({
        ...formData,
        roles: selectedRoles,
      });
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleRole = (role: AppRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription>Administra el personal del restaurante</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
                  <DialogDescription>
                    {editingUser ? "Modifica los datos del usuario" : "Crea un nuevo usuario del sistema"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={fotoPreview} />
                        <AvatarFallback>
                          {formData.nombre?.[0]}{formData.apellido?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex gap-2">
                        <Label htmlFor="foto" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Subir Foto
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id="foto"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFotoChange}
                        />
                        {fotoPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFotoFile(null);
                              setFotoPreview("");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellido">Apellido *</Label>
                        <Input
                          id="apellido"
                          value={formData.apellido}
                          onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {!editingUser && (
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required={!editingUser}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="direccion">Dirección</Label>
                        <Input
                          id="direccion"
                          value={formData.direccion}
                          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sede">Sede</Label>
                        <Select value={formData.sede_id} onValueChange={(value) => setFormData({ ...formData, sede_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar sede" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sin sede</SelectItem>
                            {sedes?.map((sede) => (
                              <SelectItem key={sede.id} value={sede.id}>
                                {sede.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="turno">Turno</Label>
                        <Select value={formData.turno} onValueChange={(value) => setFormData({ ...formData, turno: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar turno" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Sin turno</SelectItem>
                            {TURNOS.map((turno) => (
                              <SelectItem key={turno.value} value={turno.value}>
                                {turno.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Roles</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {ROLES_DISPONIBLES.map((role) => (
                          <div key={role.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={role.value}
                              checked={selectedRoles.includes(role.value)}
                              onCheckedChange={() => toggleRole(role.value)}
                            />
                            <Label htmlFor={role.value} className="cursor-pointer text-sm">
                              {role.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={crearUsuarioMutation.isPending || actualizarUsuarioMutation.isPending}>
                      {crearUsuarioMutation.isPending || actualizarUsuarioMutation.isPending
                        ? "Guardando..."
                        : editingUser
                        ? "Actualizar"
                        : "Crear Usuario"}
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
          ) : usuarios && usuarios.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={usuario.foto_url || ""} />
                          <AvatarFallback>
                            {usuario.nombre?.[0]}{usuario.apellido?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{usuario.nombre} {usuario.apellido}</p>
                          <p className="text-sm text-muted-foreground">{usuario.telefono}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{usuario.correo}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {usuario.roles?.length > 0 ? (
                          usuario.roles.map((role: AppRole) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {ROLES_DISPONIBLES.find(r => r.value === role)?.label}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">Sin roles</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{usuario.sedes?.nombre || "-"}</TableCell>
                    <TableCell className="capitalize">{usuario.turno || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleEdit(usuario)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDelete(usuario.id)}
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
              No hay usuarios registrados
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
