import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FiltrosReportes } from "@/components/admin/reportes/FiltrosReportes";
import { VentasPorPeriodo } from "@/components/admin/reportes/VentasPorPeriodo";
import { ProductosMasVendidosReporte } from "@/components/admin/reportes/ProductosMasVendidosReporte";
import { RankingEmpleados } from "@/components/admin/reportes/RankingEmpleados";
import { AnalisisPorTurno } from "@/components/admin/reportes/AnalisisPorTurno";
import { AnalisisPorSede } from "@/components/admin/reportes/AnalisisPorSede";
import { exportToCSV, prepararDatosExportacion } from "@/utils/exportReportes";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function AdminReportes() {
  const { user } = useAuth();
  const { data: roles, isLoading, isFetching } = useUserRole(user?.id);
  const navigate = useNavigate();

  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(startOfMonth(new Date()));
  const [fechaFin, setFechaFin] = useState<Date | undefined>(endOfMonth(new Date()));
  const [sedeId, setSedeId] = useState<string>("all");

  // Esperar a que terminen de cargar los roles completamente
  if (isLoading || isFetching || roles === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  const isAdmin = roles?.includes("admin_total") || roles?.includes("admin_sede");
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Obtener sedes
  const { data: sedes = [] } = useQuery({
    queryKey: ["sedes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sedes").select("id, nombre").order("nombre");
      if (error) throw error;
      return data;
    },
  });

  // Obtener datos de ventas por período
  const { data: ventasPorPeriodo = [] } = useQuery({
    queryKey: ["ventas-periodo", fechaInicio, fechaFin, sedeId],
    queryFn: async () => {
      let query = supabase
        .from("facturas")
        .select("created_at, total, orden_id, ordenes(mesa_id, mesas(salon_id, salones(sede_id)))");

      if (fechaInicio) {
        query = query.gte("created_at", fechaInicio.toISOString());
      }
      if (fechaFin) {
        query = query.lte("created_at", fechaFin.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Agrupar por fecha
      const ventasPorDia = data.reduce((acc: any, factura: any) => {
        const fecha = format(new Date(factura.created_at), "yyyy-MM-dd");
        if (!acc[fecha]) {
          acc[fecha] = { fecha, ventas: 0, ordenes: 0 };
        }
        acc[fecha].ventas += parseFloat(factura.total);
        acc[fecha].ordenes += 1;
        return acc;
      }, {});

      return Object.values(ventasPorDia).sort((a: any, b: any) => a.fecha.localeCompare(b.fecha)) as Array<{
        fecha: string;
        ventas: number;
        ordenes: number;
      }>;
    },
    enabled: !!fechaInicio && !!fechaFin,
  });

  // Productos más vendidos
  const { data: productosMasVendidos = [] } = useQuery({
    queryKey: ["productos-mas-vendidos", fechaInicio, fechaFin, sedeId],
    queryFn: async () => {
      let query = supabase
        .from("factura_items")
        .select("producto_nombre, cantidad, subtotal, factura_id, facturas(created_at)");

      const { data, error } = await query;
      if (error) throw error;

      // Filtrar por fecha
      const dataFiltrada = data.filter((item: any) => {
        const fecha = new Date(item.facturas.created_at);
        return (!fechaInicio || fecha >= fechaInicio) && (!fechaFin || fecha <= fechaFin);
      });

      // Agrupar por producto
      const productosPorNombre = dataFiltrada.reduce((acc: any, item: any) => {
        const nombre = item.producto_nombre;
        if (!acc[nombre]) {
          acc[nombre] = { nombre, cantidad: 0, total: 0 };
        }
        acc[nombre].cantidad += item.cantidad;
        acc[nombre].total += parseFloat(item.subtotal);
        return acc;
      }, {});

      return Object.values(productosPorNombre)
        .sort((a: any, b: any) => b.cantidad - a.cantidad)
        .slice(0, 10) as Array<{
        nombre: string;
        cantidad: number;
        total: number;
      }>;
    },
    enabled: !!fechaInicio && !!fechaFin,
  });

  // Productos menos vendidos
  const { data: productosMenosVendidos = [] } = useQuery({
    queryKey: ["productos-menos-vendidos", fechaInicio, fechaFin, sedeId],
    queryFn: async () => {
      let query = supabase
        .from("factura_items")
        .select("producto_nombre, cantidad, subtotal, factura_id, facturas(created_at)");

      const { data, error } = await query;
      if (error) throw error;

      const dataFiltrada = data.filter((item: any) => {
        const fecha = new Date(item.facturas.created_at);
        return (!fechaInicio || fecha >= fechaInicio) && (!fechaFin || fecha <= fechaFin);
      });

      const productosPorNombre = dataFiltrada.reduce((acc: any, item: any) => {
        const nombre = item.producto_nombre;
        if (!acc[nombre]) {
          acc[nombre] = { nombre, cantidad: 0, total: 0 };
        }
        acc[nombre].cantidad += item.cantidad;
        acc[nombre].total += parseFloat(item.subtotal);
        return acc;
      }, {});

      return Object.values(productosPorNombre)
        .sort((a: any, b: any) => a.cantidad - b.cantidad)
        .slice(0, 10) as Array<{
        nombre: string;
        cantidad: number;
        total: number;
      }>;
    },
    enabled: !!fechaInicio && !!fechaFin,
  });

  // Ranking de meseros
  const { data: rankingMeseros = [] } = useQuery({
    queryKey: ["ranking-meseros", fechaInicio, fechaFin],
    queryFn: async () => {
      let query = supabase
        .from("ordenes")
        .select("mesero_id, total, created_at, profiles!ordenes_mesero_id_fkey(nombre, apellido)");

      const { data, error } = await query;
      if (error) throw error;

      const dataFiltrada = data.filter((item: any) => {
        const fecha = new Date(item.created_at);
        return (!fechaInicio || fecha >= fechaInicio) && (!fechaFin || fecha <= fechaFin);
      });

      const meserosPorId = dataFiltrada.reduce((acc: any, orden: any) => {
        const id = orden.mesero_id;
        if (!id || !orden.profiles) return acc;
        if (!acc[id]) {
          acc[id] = {
            id,
            nombre: orden.profiles.nombre,
            apellido: orden.profiles.apellido,
            ordenes: 0,
            total_ventas: 0,
          };
        }
        acc[id].ordenes += 1;
        acc[id].total_ventas += parseFloat(orden.total || 0);
        return acc;
      }, {});

      return Object.values(meserosPorId).sort((a: any, b: any) => b.total_ventas - a.total_ventas) as Array<{
        id: string;
        nombre: string;
        apellido: string;
        ordenes: number;
        total_ventas: number;
      }>;
    },
    enabled: !!fechaInicio && !!fechaFin,
  });

  // Ranking de cocineros
  const { data: rankingCocineros = [] } = useQuery({
    queryKey: ["ranking-cocineros", fechaInicio, fechaFin],
    queryFn: async () => {
      let query = supabase
        .from("ordenes")
        .select("cocinero_id, total, created_at, profiles!ordenes_cocinero_id_fkey(nombre, apellido)");

      const { data, error } = await query;
      if (error) throw error;

      const dataFiltrada = data.filter((item: any) => {
        const fecha = new Date(item.created_at);
        return (!fechaInicio || fecha >= fechaInicio) && (!fechaFin || fecha <= fechaFin);
      });

      const cocinerosPorId = dataFiltrada.reduce((acc: any, orden: any) => {
        const id = orden.cocinero_id;
        if (!id || !orden.profiles) return acc;
        if (!acc[id]) {
          acc[id] = {
            id,
            nombre: orden.profiles.nombre,
            apellido: orden.profiles.apellido,
            ordenes: 0,
            total_ventas: 0,
          };
        }
        acc[id].ordenes += 1;
        acc[id].total_ventas += parseFloat(orden.total || 0);
        return acc;
      }, {});

      return Object.values(cocinerosPorId).sort((a: any, b: any) => b.total_ventas - a.total_ventas) as Array<{
        id: string;
        nombre: string;
        apellido: string;
        ordenes: number;
        total_ventas: number;
      }>;
    },
    enabled: !!fechaInicio && !!fechaFin,
  });

  // Análisis por turno
  const { data: analisisTurnos = [] } = useQuery({
    queryKey: ["analisis-turnos", fechaInicio, fechaFin],
    queryFn: async () => {
      let query = supabase.from("ordenes").select("turno, total, created_at");

      const { data, error } = await query;
      if (error) throw error;

      const dataFiltrada = data.filter((item: any) => {
        const fecha = new Date(item.created_at);
        return (!fechaInicio || fecha >= fechaInicio) && (!fechaFin || fecha <= fechaFin);
      });

      const turnosPorNombre = dataFiltrada.reduce((acc: any, orden: any) => {
        const turno = orden.turno;
        if (!turno) return acc;
        if (!acc[turno]) {
          acc[turno] = { turno, ordenes: 0, total: 0 };
        }
        acc[turno].ordenes += 1;
        acc[turno].total += parseFloat(orden.total || 0);
        return acc;
      }, {});

      return Object.values(turnosPorNombre) as Array<{
        turno: string;
        ordenes: number;
        total: number;
      }>;
    },
    enabled: !!fechaInicio && !!fechaFin,
  });

  // Análisis por sede
  const { data: analisisSedes = [] } = useQuery({
    queryKey: ["analisis-sedes", fechaInicio, fechaFin],
    queryFn: async () => {
      let query = supabase
        .from("ordenes")
        .select("total, created_at, mesa_id, mesas(salon_id, salones(sede_id, sedes(nombre)))");

      const { data, error } = await query;
      if (error) throw error;

      const dataFiltrada = data.filter((item: any) => {
        const fecha = new Date(item.created_at);
        return (!fechaInicio || fecha >= fechaInicio) && (!fechaFin || fecha <= fechaFin);
      });

      const sedesPorId = dataFiltrada.reduce((acc: any, orden: any) => {
        const sede = orden.mesas?.salones?.sedes?.nombre;
        if (!sede) return acc;
        if (!acc[sede]) {
          acc[sede] = { sede, ordenes: 0, total: 0 };
        }
        acc[sede].ordenes += 1;
        acc[sede].total += parseFloat(orden.total || 0);
        return acc;
      }, {});

      return Object.values(sedesPorId) as Array<{
        sede: string;
        ordenes: number;
        total: number;
      }>;
    },
    enabled: !!fechaInicio && !!fechaFin,
  });

  const handleExportExcel = async () => {
    // Dynamic import to avoid CSP issues
    const XLSX = await import("xlsx");
    
    const wb = XLSX.utils.book_new();

    // Ventas por período
    const wsVentas = XLSX.utils.json_to_sheet(prepararDatosExportacion(ventasPorPeriodo, "ventas"));
    XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas");

    // Productos más vendidos
    const wsProductos = XLSX.utils.json_to_sheet(prepararDatosExportacion(productosMasVendidos, "productos"));
    XLSX.utils.book_append_sheet(wb, wsProductos, "Productos Top");

    // Ranking meseros
    const wsMeseros = XLSX.utils.json_to_sheet(prepararDatosExportacion(rankingMeseros, "meseros"));
    XLSX.utils.book_append_sheet(wb, wsMeseros, "Meseros");

    // Ranking cocineros
    const wsCocineros = XLSX.utils.json_to_sheet(prepararDatosExportacion(rankingCocineros, "cocineros"));
    XLSX.utils.book_append_sheet(wb, wsCocineros, "Cocineros");

    XLSX.writeFile(wb, `reporte-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Reporte exportado a Excel");
  };

  const handleExportCSV = async () => {
    await exportToCSV(prepararDatosExportacion(ventasPorPeriodo, "ventas"), `ventas-${format(new Date(), "yyyy-MM-dd")}`);
    toast.success("Reporte exportado a CSV");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button onClick={() => navigate("/admin")} variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Reportes y Analytics</h1>
          <p className="text-muted-foreground">Análisis detallado de ventas y desempeño</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <FiltrosReportes
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          sedeId={sedeId}
          onFechaInicioChange={setFechaInicio}
          onFechaFinChange={setFechaFin}
          onSedeChange={setSedeId}
          onExportExcel={handleExportExcel}
          onExportCSV={handleExportCSV}
          sedes={sedes}
        />

        <VentasPorPeriodo data={ventasPorPeriodo} />

        <div className="grid gap-6 md:grid-cols-2">
          <ProductosMasVendidosReporte data={productosMasVendidos} tipo="mas" />
          <ProductosMasVendidosReporte data={productosMenosVendidos} tipo="menos" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <RankingEmpleados data={rankingMeseros} tipo="mesero" />
          <RankingEmpleados data={rankingCocineros} tipo="cocinero" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <AnalisisPorTurno data={analisisTurnos} />
          <AnalisisPorSede data={analisisSedes} />
        </div>
      </div>
    </div>
  );
}
