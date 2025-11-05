import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface FiltrosReportesProps {
  fechaInicio: Date | undefined;
  fechaFin: Date | undefined;
  sedeId: string;
  onFechaInicioChange: (date: Date | undefined) => void;
  onFechaFinChange: (date: Date | undefined) => void;
  onSedeChange: (sede: string) => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  sedes: Array<{ id: string; nombre: string }>;
}

export function FiltrosReportes({
  fechaInicio,
  fechaFin,
  sedeId,
  onFechaInicioChange,
  onFechaFinChange,
  onSedeChange,
  onExportExcel,
  onExportCSV,
  sedes,
}: FiltrosReportesProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="text-sm font-medium mb-2 block">Fecha Inicio</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fechaInicio ? format(fechaInicio, "PPP", { locale: es }) : "Seleccionar"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={fechaInicio} onSelect={onFechaInicioChange} locale={es} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fechaFin ? format(fechaFin, "PPP", { locale: es }) : "Seleccionar"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={fechaFin} onSelect={onFechaFinChange} locale={es} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="text-sm font-medium mb-2 block">Sede</label>
        <Select value={sedeId} onValueChange={onSedeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Todas las sedes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las sedes</SelectItem>
            {sedes.map((sede) => (
              <SelectItem key={sede.id} value={sede.id}>
                {sede.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={onExportExcel} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Excel
        </Button>
        <Button onClick={onExportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          CSV
        </Button>
      </div>
    </div>
  );
}
