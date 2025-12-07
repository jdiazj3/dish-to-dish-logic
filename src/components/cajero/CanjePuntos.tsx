import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Gift, Star, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CanjePuntosProps {
  clienteId: string;
  clienteNombre: string;
  puntosDisponibles: number;
  onCanjeExitoso?: () => void;
}

export function CanjePuntos({ clienteId, clienteNombre, puntosDisponibles, onCanjeExitoso }: CanjePuntosProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [premioSeleccionado, setPremioSeleccionado] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const { data: premios, isLoading } = useQuery({
    queryKey: ['premios-disponibles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('premios')
        .select('*')
        .eq('activo', true)
        .order('puntos_requeridos');
      if (error) throw error;
      return data || [];
    },
  });

  const canjeMutation = useMutation({
    mutationFn: async (premio: any) => {
      // Verificar puntos suficientes
      const { data: puntosData } = await supabase
        .from('puntos_cliente')
        .select('puntos_otorgados')
        .eq('cliente_id', clienteId);
      
      const { data: canjesData } = await supabase
        .from('canjes_puntos')
        .select('puntos_usados')
        .eq('cliente_id', clienteId)
        .neq('estado', 'cancelado');
      
      const puntosGanados = puntosData?.reduce((sum, p) => sum + p.puntos_otorgados, 0) || 0;
      const puntosUsados = canjesData?.reduce((sum, c) => sum + c.puntos_usados, 0) || 0;
      const puntosActuales = puntosGanados - puntosUsados;

      if (puntosActuales < premio.puntos_requeridos) {
        throw new Error('Puntos insuficientes');
      }

      // Verificar stock
      if (premio.stock !== -1 && premio.stock <= 0) {
        throw new Error('Premio sin stock');
      }

      // Crear el canje
      const { error: canjeError } = await supabase
        .from('canjes_puntos')
        .insert({
          cliente_id: clienteId,
          premio_id: premio.id,
          puntos_usados: premio.puntos_requeridos,
          cajero_id: user?.id,
          estado: 'canjeado',
        });

      if (canjeError) throw canjeError;

      // Actualizar stock si no es ilimitado
      if (premio.stock !== -1) {
        await supabase
          .from('premios')
          .update({ stock: premio.stock - 1 })
          .eq('id', premio.id);
      }

      return premio;
    },
    onSuccess: (premio) => {
      queryClient.invalidateQueries({ queryKey: ['premios-disponibles'] });
      queryClient.invalidateQueries({ queryKey: ['historial-cliente'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-cliente'] });
      toast.success(`¡Premio canjeado!`, {
        description: `${premio.nombre} - ${premio.puntos_requeridos} puntos`,
      });
      setConfirmDialogOpen(false);
      setPremioSeleccionado(null);
      onCanjeExitoso?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al canjear premio");
    },
  });

  const handleSeleccionarPremio = (premio: any) => {
    setPremioSeleccionado(premio);
    setConfirmDialogOpen(true);
  };

  const confirmarCanje = () => {
    if (premioSeleccionado) {
      canjeMutation.mutate(premioSeleccionado);
    }
  };

  const premiosCanjeables = premios?.filter(p => p.puntos_requeridos <= puntosDisponibles) || [];
  const premiosNoCanjeables = premios?.filter(p => p.puntos_requeridos > puntosDisponibles) || [];

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)} className="gap-1">
        <Gift className="w-4 h-4" />
        Canjear Puntos
      </Button>

      {/* Dialog principal de premios */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Canjear Puntos - {clienteNombre}
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-yellow-500 text-base">
                  <Star className="w-4 h-4 mr-1" />
                  {puntosDisponibles} puntos disponibles
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando premios...</div>
            ) : (
              <>
                {/* Premios canjeables */}
                {premiosCanjeables.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Puedes canjear ({premiosCanjeables.length})
                    </h3>
                    <div className="grid gap-3">
                      {premiosCanjeables.map((premio: any) => (
                        <Card 
                          key={premio.id} 
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => handleSeleccionarPremio(premio)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Gift className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{premio.nombre}</p>
                                  <p className="text-sm text-muted-foreground">{premio.descripcion}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {premio.tipo === 'descuento_porcentaje' 
                                      ? `${premio.valor_descuento}% de descuento`
                                      : `$${premio.valor_descuento?.toLocaleString()} de valor`
                                    }
                                    {premio.stock !== -1 && ` • ${premio.stock} disponibles`}
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-yellow-500">
                                <Star className="w-3 h-3 mr-1" />
                                {premio.puntos_requeridos}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Premios no canjeables */}
                {premiosNoCanjeables.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Necesitas más puntos ({premiosNoCanjeables.length})
                    </h3>
                    <div className="grid gap-3 opacity-60">
                      {premiosNoCanjeables.map((premio: any) => (
                        <Card key={premio.id} className="cursor-not-allowed">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                  <Gift className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">{premio.nombre}</p>
                                  <p className="text-sm text-muted-foreground">{premio.descripcion}</p>
                                  <p className="text-xs text-red-500 mt-1">
                                    Faltan {premio.puntos_requeridos - puntosDisponibles} puntos
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary">
                                <Star className="w-3 h-3 mr-1" />
                                {premio.puntos_requeridos}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {premios?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay premios disponibles
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Canje</DialogTitle>
            <DialogDescription>
              ¿Confirmas el canje de este premio?
            </DialogDescription>
          </DialogHeader>

          {premioSeleccionado && (
            <div className="py-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                      <Gift className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">{premioSeleccionado.nombre}</p>
                      <p className="text-sm text-muted-foreground">{premioSeleccionado.descripcion}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Puntos a usar:</span>
                      <span className="font-bold text-yellow-600">-{premioSeleccionado.puntos_requeridos}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Puntos restantes:</span>
                      <span className="font-medium">{puntosDisponibles - premioSeleccionado.puntos_requeridos}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarCanje} disabled={canjeMutation.isPending}>
              <Check className="w-4 h-4 mr-2" />
              Confirmar Canje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}