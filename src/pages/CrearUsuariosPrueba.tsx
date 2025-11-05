import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Users, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserResult {
  email: string;
  status: string;
  userId?: string;
  error?: string;
}

export default function CrearUsuariosPrueba() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UserResult[]>([]);

  const handleCrearUsuarios = async () => {
    setLoading(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('crear-usuarios-prueba');

      if (error) throw error;

      if (data.success) {
        setResults(data.results);
        toast.success("Usuarios de prueba procesados correctamente");
      } else {
        throw new Error(data.error || "Error al crear usuarios");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al crear usuarios de prueba");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Crear Usuarios de Prueba
            </CardTitle>
            <CardDescription>
              Genera automáticamente 5 usuarios con diferentes roles para testing rápido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">Usuarios que se crearán:</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>admin@test.com</strong> - Admin Total</li>
                <li>• <strong>mesero@test.com</strong> - Mesero (turno mañana)</li>
                <li>• <strong>cocinero@test.com</strong> - Cocinero (turno tarde)</li>
                <li>• <strong>cajero@test.com</strong> - Cajero (turno noche)</li>
                <li>• <strong>adminsede@test.com</strong> - Admin de Sede</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Contraseña para todos: <strong>Test123456</strong>
              </p>
            </div>

            <Button 
              onClick={handleCrearUsuarios} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando usuarios...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Crear Usuarios de Prueba
                </>
              )}
            </Button>

            {results.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Resultados:</h3>
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        {result.status === 'created' || result.status === 'updated' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">{result.email}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.status === 'created' && 'Creado'}
                        {result.status === 'updated' && 'Actualizado'}
                        {result.status === 'error' && `Error: ${result.error}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
