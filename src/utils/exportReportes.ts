import * as XLSX from "xlsx";

export function exportToExcel(data: any[], filename: string, sheetName: string = "Reporte") {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
