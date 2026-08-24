import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logError } from "@/utils/errorLogger";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

const DIAS = [
  { valor: 1, label: "Lun" },
  { valor: 2, label: "Mar" },
  { valor: 3, label: "Mié" },
  { valor: 4, label: "Jue" },
  { valor: 5, label: "Vie" },
  { valor: 6, label: "Sáb" },
  { valor: 0, label: "Dom" },
];

export function ConfigValeras() {
  const queryClient = useQueryClient();

  const [vigencia, setVigencia] = useState("90");
  const [prefijo, setPrefijo] = useState("VAL");
  const [maxConsumo, setMaxConsumo] = useState("0");
  const [maxDia, setMaxDia] = useState("0");
  const [dias, setDias] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [productoDefault, setProductoDefault] = useState<string>("none");

  const { data: config } = useQuery({
    queryKey: ["valeras-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("valeras_config").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: productos } = useQuery({
    queryKey: ["productos-valeras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio")
        .eq("disponible", true)
        .order("nombre");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!config) return;
    setVigencia(String(config.vigencia_dias ?? 90));
    setPrefijo(config.prefijo ?? "VAL");
    setMaxConsumo(String((config as any).max_por_consumo ?? 0));
    setMaxDia(String((config as any).max_por_dia ?? 0));
    setDias((config as any).dias_permitidos ?? [0, 1, 2, 3, 4, 5, 6]);
    setHoraInicio(((config as any).hora_inicio ?? "").slice(0, 5));
    setHoraFin(((config as any).hora_fin ?? "").slice(0, 5));
    setProductoDefault(config.producto_default_id ?? "none");
  }, [config]);

  const guardar = useMutation({
    mutationFn: async () => {
      const payload = {
        vigencia_dias: Math.max(0, Number(vigencia) || 0),
        prefijo: prefijo.trim().toUpperCase() || "VAL",
        max_por_consumo: Math.max(0, Number(maxConsumo) || 0),
        max_por_dia: Math.max(0, Number(maxDia) || 0),
        dias_permitidos: dias.length ? [...dias].sort() : [0, 1, 2, 3, 4, 5, 6],
        hora_inicio: horaInicio ? `${horaInicio}:00` : null,
        hora_fin: horaFin ? `${horaFin}:00` : null,
        producto_default_id: productoDefault === "none" ? null : productoDefault,
      };

      if (config?.id) {
        const { error } = await supabase.from("valeras_config").update(payload).eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("valeras_config").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Reglas de valeras actualizadas");
      queryClient.invalidateQueries({ queryKey: ["valeras-config"] });
    },
    onError: (e: any) => {
      logError("Error guardando config de valeras:", e);
      toast.error(e?.message || "No se pudieron guardar las reglas");
    },
  });

  const toggleDia = (valor: number) =>
    setDias((prev) => (prev.includes(valor) ? prev.filter((d) => d !== valor) : [...prev, valor]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Reglas de uso de valeras
        </CardTitle>
        <CardDescription>Vencimiento, topes de consumo y horarios permitidos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Vigencia (días)</Label>
            <Input type="number" min={0} value={vigencia} onChange={(e) => setVigencia(e.target.value)} />
            <p className="text-xs text-muted-foreground">0 = sin fecha límite</p>
          </div>
          <div className="space-y-2">
            <Label>Prefijo del código</Label>
            <Input value={prefijo} onChange={(e) => setPrefijo(e.target.value.slice(0, 6))} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Producto por defecto</Label>
          <Select value={productoDefault} onValueChange={setProductoDefault}>
            <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ninguno</SelectItem>
              {(productos || []).map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Máx. almuerzos por consumo</Label>
            <Input type="number" min={0} value={maxConsumo} onChange={(e) => setMaxConsumo(e.target.value)} />
            <p className="text-xs text-muted-foreground">0 = sin tope</p>
          </div>
          <div className="space-y-2">
            <Label>Máx. almuerzos por día</Label>
            <Input type="number" min={0} value={maxDia} onChange={(e) => setMaxDia(e.target.value)} />
            <p className="text-xs text-muted-foreground">Por cada valera. 0 = sin tope</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Días en que se puede redimir</Label>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => (
              <Toggle
                key={d.valor}
                pressed={dias.includes(d.valor)}
                onPressedChange={() => toggleDia(d.valor)}
                variant="outline"
                size="sm"
              >
                {d.label}
              </Toggle>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Desde (hora)</Label>
            <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hasta (hora)</Label>
            <Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Deja las horas vacías para permitir la redención a cualquier hora.</p>

        <Button className="w-full" onClick={() => guardar.mutate()} disabled={guardar.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {guardar.isPending ? "Guardando…" : "Guardar reglas"}
        </Button>
      </CardContent>
    </Card>
  );
}
