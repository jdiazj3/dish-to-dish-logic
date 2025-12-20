import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Star, Sun, Sunset, Moon, Edit, Save, Gift } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GestionPremios } from "@/components/admin/GestionPremios";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCOP } from "@/utils/formatCurrency";

const turnoLabels: { [key: string]: { label: string; icon: any; color: string } } = {
  manana: { label: "Mañana", icon: Sun, color: "text-yellow-500" },
  tarde: { label: "Tarde", icon: Sunset, color: "text-orange-500" },
  noche: { label: "Noche", icon: Moon, color: "text-blue-500" },
};

export default function AdminPuntos() {
  const { user } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    puntos_por_peso: 1,
    monto_base: 1000,
    descripcion: "",
    activo: true,
  });

  // Query para configuración de puntos
  const { data: puntosConfig, isLoading: configLoading } = useQuery({
    queryKey: ['puntos-configuracion-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('puntos_configuracion')
        .select('*')
        .order('turno');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Query para estadísticas de puntos
  const { data: estadisticas } = useQuery({
    queryKey: ['estadisticas-puntos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('puntos_cliente')
        .select('puntos_otorgados, turno, created_at');
      
      if (error) throw error;

      const totalPuntosOtorgados = data?.reduce((sum, p) => sum + p.puntos_otorgados, 0) || 0;
      const totalTransacciones = data?.length || 0;

      // Puntos por turno
      const puntosPorTurno: { [key: string]: number } = { manana: 0, tarde: 0, noche: 0 };
      data?.forEach(p => {
        puntosPorTurno[p.turno] = (puntosPorTurno[p.turno] || 0) + p.puntos_otorgados;
      });

      return {
        totalPuntosOtorgados,
        totalTransacciones,
        puntosPorTurno,
      };
    },
  });

  // Mutation para actualizar configuración
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('puntos_configuracion')
        .update({
          puntos_por_peso: data.puntos_por_peso,
          monto_base: data.monto_base,
          descripcion: data.descripcion,
          activo: data.activo,
        })
        .eq('id', data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puntos-configuracion-admin'] });
      queryClient.invalidateQueries({ queryKey: ['puntos-configuracion'] });
      toast.success("Configuración actualizada");
      setDialogOpen(false);
      setEditingConfig(null);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error("Error al actualizar configuración");
    },
  });

  // Esperar a que terminen de cargar los roles
  if (isLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  const isAdmin = roles?.includes('admin_total') || roles?.includes('admin_sede');
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleEdit = (config: any) => {
    setEditingConfig(config);
    setFormData({
      puntos_por_peso: config.puntos_por_peso,
      monto_base: config.monto_base,
      descripcion: config.descripcion || "",
      activo: config.activo,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: editingConfig.id,
      ...formData,
    });
  };

  const toggleActivo = async (config: any) => {
    updateMutation.mutate({
      ...config,
      activo: !config.activo,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Programa de Puntos</h1>
              <p className="text-sm text-muted-foreground">Configuración de puntos por lealtad</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <Tabs defaultValue="configuracion" className="space-y-6">
          <TabsList>
            <TabsTrigger value="configuracion" className="gap-2">
              <Star className="w-4 h-4" />
              Configuración de Puntos
            </TabsTrigger>
            <TabsTrigger value="premios" className="gap-2">
              <Gift className="w-4 h-4" />
              Catálogo de Premios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuracion" className="space-y-6">
            {/* Estadísticas */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-yellow-500/10 border-yellow-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Star className="w-8 h-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Puntos Otorgados</p>
                      <p className="text-2xl font-bold">{estadisticas?.totalPuntosOtorgados.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {Object.entries(turnoLabels).map(([turno, info]) => {
                const Icon = info.icon;
                return (
                  <Card key={turno}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-8 h-8 ${info.color}`} />
                        <div>
                          <p className="text-sm text-muted-foreground">Puntos {info.label}</p>
                          <p className="text-2xl font-bold">
                            {estadisticas?.puntosPorTurno?.[turno]?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Configuración por turno */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Puntos por Turno</CardTitle>
                <CardDescription>
                  Define cuántos puntos ganan los clientes por cada compra según el turno
                </CardDescription>
              </CardHeader>
              <CardContent>
                {configLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando configuración...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Turno</TableHead>
                        <TableHead>Puntos por cada</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Última Actualización</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {puntosConfig?.map((config: any) => {
                        const turnoInfo = turnoLabels[config.turno] || { label: config.turno, icon: Star, color: "text-primary" };
                        const Icon = turnoInfo.icon;
                        return (
                          <TableRow key={config.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className={`w-5 h-5 ${turnoInfo.color}`} />
                                <span className="font-medium">{turnoInfo.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                            <Badge variant="secondary" className="text-base">
                                {config.puntos_por_peso} punto{config.puntos_por_peso !== 1 ? 's' : ''} / {formatCOP(config.monto_base)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-xs truncate">
                              {config.descripcion || '-'}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={config.activo}
                                onCheckedChange={() => toggleActivo(config)}
                              />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(config.updated_at), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(config)}>
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Información */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">¿Cómo funcionan los puntos?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Los puntos se otorgan automáticamente al facturar si el cliente está registrado.</p>
                <p>• La fórmula es: <strong>Puntos = (Total Factura / Monto Base) × Puntos por Peso</strong></p>
                <p>• Ejemplo: Si el monto base es $1,000 y puntos por peso es 2, una factura de $50,000 otorga 100 puntos.</p>
                <p>• Puedes activar o desactivar los puntos por turno usando el switch.</p>
                <p>• El turno se toma de la orden original, no del momento de facturación.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="premios">
            <GestionPremios />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de edición */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Configuración - {editingConfig && turnoLabels[editingConfig.turno]?.label}
            </DialogTitle>
            <DialogDescription>
              Modifica los parámetros de asignación de puntos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="puntos">Puntos a Otorgar</Label>
                <Input
                  id="puntos"
                  type="number"
                  min="0"
                  value={formData.puntos_por_peso}
                  onChange={(e) => setFormData({ ...formData, puntos_por_peso: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="monto">Por cada $ (Monto Base)</Label>
                <Input
                  id="monto"
                  type="number"
                  min="1"
                  value={formData.monto_base}
                  onChange={(e) => setFormData({ ...formData, monto_base: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                placeholder="Ej: Turno noche promoción doble puntos"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label htmlFor="activo">Activo</Label>
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Ejemplo de cálculo:</p>
              <p className="text-muted-foreground">
                Una factura de $50,000 otorgaría{" "}
                <strong className="text-foreground">
                  {Math.floor((50000 / (formData.monto_base || 1)) * formData.puntos_por_peso)} puntos
                </strong>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}