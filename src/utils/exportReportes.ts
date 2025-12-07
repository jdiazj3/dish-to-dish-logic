// Native CSV/Excel export without xlsx library to avoid CSP eval() issues

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function jsonToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const headerRow = headers.map(escapeCSVValue).join(',');
  
  const rows = data.map(row => 
    headers.map(header => escapeCSVValue(row[header])).join(',')
  );
  
  return [headerRow, ...rows].join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: mimeType });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToExcel(data: any[], filename: string, _sheetName: string = "Reporte") {
  // Export as CSV with .xlsx extension for Excel compatibility
  // This avoids the xlsx library which uses eval()
  const csv = jsonToCSV(data);
  downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
}

export async function exportToCSV(data: any[], filename: string) {
  const csv = jsonToCSV(data);
  downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
}

export function prepararDatosExportacion(datos: any[], tipo: string) {
  switch (tipo) {
    case "ventas":
      return datos.map((item) => ({
        Fecha: item.fecha,
        Ventas: item.ventas,
        Órdenes: item.ordenes,
      }));
    case "productos":
      return datos.map((item) => ({
        Producto: item.nombre,
        Cantidad: item.cantidad,
        Total: item.total,
      }));
    case "meseros":
    case "cocineros":
      return datos.map((item, index) => ({
        Posición: index + 1,
        Nombre: `${item.nombre} ${item.apellido}`,
        Órdenes: item.ordenes,
        "Ventas Totales": item.total_ventas,
      }));
    case "turnos":
      return datos.map((item) => ({
        Turno: item.turno,
        Órdenes: item.ordenes,
        Total: item.total,
      }));
    case "sedes":
      return datos.map((item) => ({
        Sede: item.sede,
        Órdenes: item.ordenes,
        Total: item.total,
      }));
    default:
      return datos;
  }
}
