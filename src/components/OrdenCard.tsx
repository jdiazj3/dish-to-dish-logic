import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Truck, User } from "lucide-react";
import { formatCOP } from "@/utils/formatCurrency";

type Orden = {
  id: string;
  numero_orden?: number;
  created_at: string;
  total: number;
  es_domicilio?: boolean;
  instrucciones_entrega?: string | null;
  nombre_cliente?: string | null;
  mesas: { numero: number; salones: { nombre: string } } | null;
  orden_productos: Array<{
    cantidad: number;
    numero_silla: number;
    notas?: string | null;
    productos: { nombre: string } | null;
  }>;
};

type OrdenCardProps = {
  orden: Orden;
  estado: 'recibida' | 'tomada' | 'entregada';
  onTomarOrden?: (id: string) => void;
  onEntregarOrden?: (id: string) => void;
  loading?: boolean;
};

export function OrdenCard({ orden, estado, onTomarOrden, onEntregarOrden, loading }: OrdenCardProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const productosPorSilla = orden.orden_productos.reduce((acc, p) => {
    if (!acc[p.numero_silla]) {
      acc[p.numero_silla] = [];
    }
    acc[p.numero_silla].push(p);
    return acc;
  }, {} as Record<number, typeof orden.orden_productos>);

  const esDomicilio = orden.es_domicilio;

  return (
    <Card className={`shadow-md hover:shadow-lg transition-shadow ${
      esDomicilio 
        ? 'border-2 border-orange-400 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-950/20' 
        : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {orden.numero_orden && (
              <div className={`flex items-center justify-center w-14 h-14 rounded-full font-bold text-2xl shadow-lg ${
                esDomicilio 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-primary text-primary-foreground'
              }`}>
                {orden.numero_orden}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {esDomicilio ? (
                  <>
                    <Truck className="w-4 h-4 text-orange-600" />
                    <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
                      DOMICILIO
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-bold">Mesa {orden.mesas?.numero}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {esDomicilio ? `Ubicación ${orden.mesas?.numero}` : orden.mesas?.salones?.nombre}
              </p>
              {orden.nombre_cliente && (
                <p className="text-sm font-medium flex items-center gap-1 mt-1">
                  <User className="w-3 h-3" />
                  {orden.nombre_cliente}
                </p>
              )}
            </div>
          </div>
          <div className="text-right space-y-1">
            {esDomicilio && (
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                <Truck className="w-3 h-3 mr-1" />
                Externo
              </Badge>
            )}
            <Badge variant={
              estado === 'recibida' ? 'destructive' : 
              estado === 'tomada' ? 'default' : 
              'outline'
            }>
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(orden.created_at)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Instrucciones de entrega para domicilios */}
        {esDomicilio && orden.instrucciones_entrega && (
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-300 dark:border-orange-700">
            <p className="text-xs font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3" />
              Instrucciones de entrega:
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-200">
              {orden.instrucciones_entrega}
            </p>
          </div>
        )}

        {Object.entries(productosPorSilla).map(([silla, productos]) => (
          <div key={silla} className="p-3 bg-muted rounded-lg">
            <p className="font-semibold text-sm mb-1">
              {esDomicilio ? `Persona ${silla}` : `Silla ${silla}`}
            </p>
            <div className="space-y-1">
              {productos.map((p, idx) => (
                <div key={idx}>
                  <p className="text-sm">
                    • {p.cantidad}x {p.productos?.nombre}
                  </p>
                  {p.notas && (
                    <p className="text-xs text-amber-600 ml-3 italic">📝 {p.notas}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-bold text-lg">Total: {formatCOP(orden.total)}</span>
          {estado === 'recibida' && onTomarOrden && (
            <Button 
              onClick={() => onTomarOrden(orden.id)}
              disabled={loading}
              className={esDomicilio ? "bg-orange-500 hover:bg-orange-600" : "bg-gradient-primary"}
            >
              Tomar Orden
            </Button>
          )}
          {estado === 'tomada' && onEntregarOrden && (
            <Button 
              onClick={() => onEntregarOrden(orden.id)}
              disabled={loading}
              className={esDomicilio ? "bg-orange-500 hover:bg-orange-600" : "bg-gradient-success"}
            >
              {esDomicilio ? "Listo para Envío" : "Entregar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
