import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

type Orden = {
  id: string;
  created_at: string;
  total: number;
  mesas: { numero: number; salones: { nombre: string } } | null;
  profiles: { nombre: string; apellido: string } | null;
  orden_productos: Array<{
    cantidad: number;
    numero_silla: number;
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

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-lg font-bold">Mesa {orden.mesas?.numero}</p>
            <p className="text-sm text-muted-foreground">{orden.mesas?.salones?.nombre}</p>
            <p className="text-xs text-muted-foreground">
              Mesero: {orden.profiles?.nombre} {orden.profiles?.apellido}
            </p>
          </div>
          <div className="text-right">
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
        {Object.entries(productosPorSilla).map(([silla, productos]) => (
          <div key={silla} className="p-3 bg-muted rounded-lg">
            <p className="font-semibold text-sm mb-1">Silla {silla}</p>
            <div className="space-y-1">
              {productos.map((p, idx) => (
                <p key={idx} className="text-sm">
                  • {p.cantidad}x {p.productos?.nombre}
                </p>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-bold text-lg">Total: ${Number(orden.total).toFixed(2)}</span>
          {estado === 'recibida' && onTomarOrden && (
            <Button 
              onClick={() => onTomarOrden(orden.id)}
              disabled={loading}
              className="bg-gradient-primary"
            >
              Tomar Orden
            </Button>
          )}
          {estado === 'tomada' && onEntregarOrden && (
            <Button 
              onClick={() => onEntregarOrden(orden.id)}
              disabled={loading}
              className="bg-gradient-success"
            >
              Entregar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
