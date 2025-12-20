import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { formatCOP } from "@/utils/formatCurrency";

interface RankingEmpleadosProps {
  data: Array<{
    id: string;
    nombre: string;
    apellido: string;
    ordenes: number;
    total_ventas: number;
  }>;
  tipo: "mesero" | "cocinero";
}

export function RankingEmpleados({ data, tipo }: RankingEmpleadosProps) {
  const getMedalla = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de {tipo === "mesero" ? "Meseros" : "Cocineros"}</CardTitle>
        <CardDescription>Desempeño por órdenes y ventas totales</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Pos</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">Órdenes</TableHead>
              <TableHead className="text-right">Ventas Totales</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((empleado, index) => (
              <TableRow key={empleado.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getMedalla(index)}
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell>
                  {empleado.nombre} {empleado.apellido}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{empleado.ordenes}</Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCOP(empleado.total_ventas || 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
