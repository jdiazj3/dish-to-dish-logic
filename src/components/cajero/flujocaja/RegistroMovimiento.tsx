import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { formatCOP } from "@/utils/formatCurrency";
import { logError } from "@/utils/errorLogger";

interface CategoriaGasto {
  id: string;
  nombre: string;
  tipo: string;
}

interface Cuenta {
  id: string;
  nombre: string;
  tipo: string;
  saldo_actual: number;
  color: string;
  activa: boolean;
}

export function RegistroMovimiento() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [tipo, setTipo] = useState<"salida" | "entrada" | "reposicion">("salida");
  const [monto, setMonto] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [cuentaId, setCuentaId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [notas, setNotas] = useState("");
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-gastos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_gastos')
        .select('*')
        .eq('activa', true)
        .order('nombre');
      
      if (error) throw error;
      return data as CategoriaGasto[];
    }
  });

  const { data: cuentas = [] } = useQuery({
    queryKey: ['cuentas-flujo-activas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuentas_flujo')
        .select('*')
        .eq('activa', true)
        .order('nombre');
      
      if (error) throw error;
      return data as Cuenta[];
    }
  });

  const registrarMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("No autenticado");
      
      let comprobanteUrl = null;
      
      // Subir comprobante si existe
      if (comprobante) {
        setUploading(true);
        const fileExt = comprobante.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('comprobantes')
          .upload(fileName, comprobante);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('comprobantes')
          .getPublicUrl(fileName);
        
        comprobanteUrl = urlData.publicUrl;
        setUploading(false);
      }
      
      const { error } = await supabase
        .from('movimientos_caja')
        .insert({
          tipo,
          monto: parseFloat(monto),
          categoria_gasto_id: categoriaId || null,
          cuenta_id: cuentaId || null,
          descripcion,
          notas: notas || null,
          comprobante_url: comprobanteUrl,
          registrado_por: user.id,
          estado: 'aprobado'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos-caja'] });
      queryClient.invalidateQueries({ queryKey: ['flujo-caja-resumen'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas-flujo'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas-flujo-activas'] });
      toast.success("Movimiento registrado correctamente");
      // Reset form
      setMonto("");
      setCategoriaId("");
      setCuentaId("");
      setDescripcion("");
      setNotas("");
      setComprobante(null);
    },
    onError: (error) => {
      logError("Error al registrar movimiento:", error)
      toast.error("Error al registrar el movimiento");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!monto || parseFloat(monto) <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    
    if (!descripcion.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }
    
    registrarMutation.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo no puede superar 5MB");
        return;
      }
      setComprobante(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Movimiento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salida">Salida (Gasto)</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="reposicion">Reposición Caja Menor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                placeholder="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                min="0"
                step="100"
              />
              {monto && <p className="text-sm text-muted-foreground">{formatCOP(parseFloat(monto))}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cuenta / Medio *</Label>
            <Select value={cuentaId} onValueChange={setCuentaId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cuenta" />
              </SelectTrigger>
              <SelectContent>
                {cuentas.map((cuenta) => (
                  <SelectItem key={cuenta.id} value={cuenta.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cuenta.color }} />
                      {cuenta.nombre} - {formatCOP(cuenta.saldo_actual)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tipo === "salida" && (
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Input
              placeholder="Ej: Compra de verduras en plaza"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notas adicionales</Label>
            <Textarea
              placeholder="Información adicional..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Comprobante (opcional)</Label>
            {comprobante ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <span className="text-sm truncate flex-1">{comprobante.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setComprobante(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="comprobante-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('comprobante-input')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir comprobante
                </Button>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={registrarMutation.isPending || uploading}
          >
            {(registrarMutation.isPending || uploading) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Registrar Movimiento
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
