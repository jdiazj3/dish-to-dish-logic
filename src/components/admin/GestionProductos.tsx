import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, Upload, Image as ImageIcon } from "lucide-react";

export function GestionProductos() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<any>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("all");

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });

  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos-admin', searchTerm, categoriaFilter],
    queryFn: async () => {
      let query = supabase
        .from('productos')
        .select('*, categorias(nombre)')
        .order('nombre');

      if (searchTerm) {
        query = query.ilike('nombre', `%${searchTerm}%`);
      }

      if (categoriaFilter !== 'all') {
        query = query.eq('categoria_id', categoriaFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const uploadFoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('productos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('productos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      let fotoUrl = "";
      if (fotoFile) {
        fotoUrl = await uploadFoto(fotoFile);
      }

      const { error } = await supabase
        .from('productos')
        .insert({
          nombre,
          descripcion,
          precio: parseFloat(precio),
          categoria_id: categoriaId || null,
          disponible,
          foto_url: fotoUrl || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-admin'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success("Producto creado");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Error al crear producto", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      let fotoUrl = editingProducto.foto_url;
      
      if (fotoFile) {
        fotoUrl = await uploadFoto(fotoFile);
      }

      const { error } = await supabase
        .from('productos')
        .update({
          nombre,
          descripcion,
          precio: parseFloat(precio),
          categoria_id: categoriaId || null,
          disponible,
          foto_url: fotoUrl || null,
        })
        .eq('id', editingProducto.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-admin'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success("Producto actualizado");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Error al actualizar producto", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-admin'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success("Producto eliminado");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar producto", { description: error.message });
    },
  });

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setCategoriaId("");
    setDisponible(true);
    setFotoFile(null);
    setFotoPreview("");
    setEditingProducto(null);
    setDialogOpen(false);
  };

  const handleEdit = (producto: any) => {
    setEditingProducto(producto);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion || "");
    setPrecio(producto.precio.toString());
    setCategoriaId(producto.categoria_id || "");
    setDisponible(producto.disponible);
    setFotoPreview(producto.foto_url || "");
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = () => {
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!precio || parseFloat(precio) <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }

    if (editingProducto) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex-1 flex gap-2 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categorias?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProducto ? "Editar Producto" : "Nuevo Producto"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="foto">Foto del Producto</Label>
                <div className="flex flex-col items-center gap-4">
                  {fotoPreview ? (
                    <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={fotoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="w-full">
                    <Input
                      id="foto"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('foto')?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {fotoPreview ? "Cambiar Foto" : "Subir Foto"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Bandeja Paisa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio">Precio *</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción del producto"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="disponible">Disponible</Label>
                    <Switch
                      id="disponible"
                      checked={disponible}
                      onCheckedChange={setDisponible}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingProducto ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {productos?.map((producto) => (
          <Card key={producto.id} className="overflow-hidden">
            <div className="h-48 bg-muted relative">
              {producto.foto_url ? (
                <img
                  src={producto.foto_url}
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={producto.disponible ? "default" : "secondary"}>
                  {producto.disponible ? "Disponible" : "No disponible"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold">{producto.nombre}</h3>
                {producto.categorias && (
                  <p className="text-xs text-muted-foreground">{producto.categorias.nombre}</p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {producto.descripcion || "Sin descripción"}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  ${Number(producto.precio).toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(producto)}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(producto.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {productos?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron productos</p>
        </div>
      )}
    </div>
  );
}
