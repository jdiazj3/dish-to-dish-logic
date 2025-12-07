import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Gift, Plus, Edit, Trash2, Star, Percent, DollarSign } from "lucide-react";
import { toast } from "sonner";

const tipoLabels: { [key: string]: { label: string; icon: any } } = {
  descuento_valor: { label: "Descuento Valor", icon: DollarSign },
  descuento_porcentaje: { label: "Descuento %", icon: Percent },
  producto: { label: "Producto", icon: Gift },
};

export function GestionPremios() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPremio, setEditingPremio] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    puntos_requeridos: 50,
    tipo: "descuento_valor",
    valor_descuento: 10000,
    stock: -1,
    activo: true,
  });

  const { data: premios, isLoading } = useQuery({
    queryKey: ['premios-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('premios')
        .select('*')
        .order('puntos_requeridos');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: estadisticas } = useQuery({
    queryKey: ['estadisticas-canjes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canjes_puntos')
        .select('puntos_usados, premio_id');
      if (error) throw error;
      
      const totalCanjes = data?.length || 0;
      const totalPuntosUsados = data?.reduce((sum, c) => sum + c.puntos_usados, 0) || 0;
      
      return { totalCanjes, totalPuntosUsados };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('premios').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premios-admin'] });
      toast.success("Premio creado");
      closeDialog();
    },
    onError: () => toast.error("Error al crear premio"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from('premios').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premios-admin'] });
      toast.success("Premio actualizado");
      closeDialog();
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('premios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premios-admin'] });
      toast.success("Premio eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPremio(null);
    setFormData({
      nombre: "",
      descripcion: "",
      puntos_requeridos: 50,
      tipo: "descuento_valor",
      valor_descuento: 10000,
      stock: -1,
      activo: true,
    });
  };

  const handleEdit = (premio: any) => {
    setEditingPremio(premio);
    setFormData({
      nombre: premio.nombre,
      descripcion: premio.descripcion || "",
      puntos_requeridos: premio.puntos_requeridos,
      tipo: premio.tipo,
      valor_descuento: premio.valor_descuento || 0,
      stock: premio.stock,
      activo: premio.activo,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (editingPremio) {
      updateMutation.mutate({ id: editingPremio.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleActivo = (premio: any) => {
    updateMutation.mutate({ id: premio.id, activo: !premio.activo });
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Gift className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Premios Activos</p>
                <p className="text-2xl font-bold">{premios?.filter(p => p.activo).length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Canjes</p>
                <p className="text-2xl font-bold">{estadisticas?.totalCanjes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Puntos Canjeados</p>
                <p className="text-2xl font-bold">{estadisticas?.totalPuntosUsados?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de premios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catálogo de Premios</CardTitle>
              <CardDescription>Premios disponibles para canje de puntos</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Premio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : premios && premios.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Premio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Puntos</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {premios.map((premio: any) => {
                  const tipoInfo = tipoLabels[premio.tipo] || tipoLabels.descuento_valor;
                  const Icon = tipoInfo.icon;
                  return (
                    <TableRow key={premio.id} className={!premio.activo ? "opacity-50" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{premio.nombre}</p>
                          {premio.descripcion && (
                            <p className="text-xs text-muted-foreground truncate max-w-48">
                              {premio.descripcion}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Icon className="w-3 h-3" />
                          {tipoInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-500">
                          <Star className="w-3 h-3 mr-1" />
                          {premio.puntos_requeridos}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {premio.tipo === 'descuento_porcentaje' 
                          ? `${premio.valor_descuento}%`
                          : `$${premio.valor_descuento?.toLocaleString()}`
                        }
                      </TableCell>
                      <TableCell>
                        {premio.stock === -1 ? "∞" : premio.stock}
                      </TableCell>
                      <TableCell>
                        <Switch checked={premio.activo} onCheckedChange={() => toggleActivo(premio)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(premio)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => deleteMutation.mutate(premio.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay premios configurados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPremio ? "Editar Premio" : "Nuevo Premio"}</DialogTitle>
            <DialogDescription>
              {editingPremio ? "Modifica los datos del premio" : "Crea un nuevo premio para el programa de puntos"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nombre">Nombre del Premio *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Postre Gratis"
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del premio..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="puntos">Puntos Requeridos *</Label>
                <Input
                  id="puntos"
                  type="number"
                  min="1"
                  value={formData.puntos_requeridos}
                  onChange={(e) => setFormData({ ...formData, puntos_requeridos: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo de Premio</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="descuento_valor">Descuento en Pesos</SelectItem>
                    <SelectItem value="descuento_porcentaje">Descuento Porcentaje</SelectItem>
                    <SelectItem value="producto">Producto Gratis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor">
                  {formData.tipo === 'descuento_porcentaje' ? 'Porcentaje (%)' : 'Valor ($)'}
                </Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  value={formData.valor_descuento}
                  onChange={(e) => setFormData({ ...formData, valor_descuento: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock (-1 = ilimitado)</Label>
                <Input
                  id="stock"
                  type="number"
                  min="-1"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label htmlFor="activo">Premio activo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingPremio ? "Guardar Cambios" : "Crear Premio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}