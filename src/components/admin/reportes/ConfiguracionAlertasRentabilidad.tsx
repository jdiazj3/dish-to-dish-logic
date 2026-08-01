import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Bell, Mail, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logError } from "@/utils/errorLogger";

interface ConfigAlerta {
  id: string;
  margen_minimo: number;
  email_admin: string | null;
  activo: boolean;
}

export function ConfiguracionAlertasRentabilidad() {
  const queryClient = useQueryClient();
  const [margenMinimo, setMargenMinimo] = useState(20);
  const [emailAdmin, setEmailAdmin] = useState("");
  const [activo, setActivo] = useState(true);

  const { data: config, isLoading } = useQuery({
    queryKey: ["alertas-rentabilidad-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alertas_rentabilidad_config")
        .select("*")
        .single();
      
      if (error) throw error;
      return data as ConfigAlerta;
    },
  });

  useEffect(() => {
    if (config) {
      setMargenMinimo(config.margen_minimo);
      setEmailAdmin(config.email_admin || "");
      setActivo(config.activo);
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ConfigAlerta>) => {
      if (!config?.id) throw new Error("No hay configuración");
      
      const { error } = await supabase
        .from("alertas_rentabilidad_config")
        .update(data)
        .eq("id", config.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas-rentabilidad-config"] });
      toast.success("Configuración guardada correctamente");
    },
    onError: (error) => {
      logError("Error al guardar:", error)
      toast.error("Error al guardar la configuración");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      margen_minimo: margenMinimo,
      email_admin: emailAdmin || null,
      activo,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-500" />
          Configuración de Alertas de Rentabilidad
        </CardTitle>
        <CardDescription>
          Configura cuándo recibir alertas cuando el margen de ganancia sea bajo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alertas activas
            </Label>
            <p className="text-sm text-muted-foreground">
              Recibir notificaciones cuando el margen esté bajo
            </p>
          </div>
          <Switch
            checked={activo}
            onCheckedChange={setActivo}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="margen">Margen mínimo de ganancia (%)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="margen"
              type="number"
              min={0}
              max={100}
              value={margenMinimo}
              onChange={(e) => setMargenMinimo(parseFloat(e.target.value) || 0)}
              className="w-32"
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Se mostrará una alerta cuando el margen sea menor a este porcentaje
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email para notificaciones
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@empresa.com"
            value={emailAdmin}
            onChange={(e) => setEmailAdmin(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Recibirás un correo cuando el margen esté por debajo del umbral
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isPending}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? "Guardando..." : "Guardar configuración"}
        </Button>
      </CardContent>
    </Card>
  );
}
