import QRCode from "qrcode";
import { formatCOP } from "@/utils/formatCurrency";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface ValeraComprobante {
  codigo: string;
  qr_token: string;
  producto_nombre: string;
  cantidad_total: number;
  cantidad_usada?: number;
  precio_unitario: number;
  total_pagado: number;
  nombre_cliente?: string | null;
  fecha_vencimiento?: string | null;
  restaurante?: string;
}

export async function generarQRDataUrl(texto: string): Promise<string> {
  return QRCode.toDataURL(texto, { width: 320, margin: 1 });
}

export async function imprimirValera(valera: ValeraComprobante): Promise<void> {
  const qr = await generarQRDataUrl(valera.qr_token);
  const restantes = valera.cantidad_total - (valera.cantidad_usada ?? 0);

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8" /><title>Valera ${escapeHtml(valera.codigo)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  body { font-family: 'Courier New', monospace; width: 72mm; margin: 0 auto; color: #000; }
  h1 { font-size: 15px; text-align: center; margin: 0 0 2px; }
  .sub { text-align: center; font-size: 11px; margin-bottom: 8px; }
  .codigo { text-align: center; font-size: 18px; font-weight: bold; letter-spacing: 1px; border: 2px dashed #000; padding: 6px; margin: 8px 0; }
  .qr { text-align: center; margin: 8px 0; }
  .qr img { width: 46mm; height: 46mm; }
  table { width: 100%; font-size: 12px; border-collapse: collapse; }
  td { padding: 2px 0; }
  td.r { text-align: right; font-weight: bold; }
  .total { border-top: 1px dashed #000; margin-top: 6px; padding-top: 6px; font-size: 14px; font-weight: bold; display: flex; justify-content: space-between; }
  .foot { text-align: center; font-size: 10px; margin-top: 10px; }
</style></head>
<body>
  <h1>${escapeHtml(valera.restaurante || "VALERA DE ALMUERZOS")}</h1>
  <div class="sub">Comprobante de almuerzos prepagados</div>
  <div class="codigo">${escapeHtml(valera.codigo)}</div>
  <div class="qr"><img src="${qr}" alt="Código QR de la valera" /></div>
  <table>
    <tr><td>Producto</td><td class="r">${escapeHtml(valera.producto_nombre)}</td></tr>
    <tr><td>Almuerzos</td><td class="r">${escapeHtml(valera.cantidad_total)}</td></tr>
    <tr><td>Disponibles</td><td class="r">${escapeHtml(restantes)}</td></tr>
    <tr><td>Valor unitario</td><td class="r">${escapeHtml(formatCOP(valera.precio_unitario))}</td></tr>
    ${valera.nombre_cliente ? `<tr><td>Cliente</td><td class="r">${escapeHtml(valera.nombre_cliente)}</td></tr>` : ""}
    ${valera.fecha_vencimiento ? `<tr><td>Vence</td><td class="r">${escapeHtml(valera.fecha_vencimiento)}</td></tr>` : ""}
  </table>
  <div class="total"><span>TOTAL PAGADO</span><span>${escapeHtml(formatCOP(valera.total_pagado))}</span></div>
  <div class="foot">Presenta este código QR en caja para redimir tus almuerzos.<br/>Conserva este comprobante.</div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); }<\/script>
</body></html>`;

  const ventana = window.open("", "_blank", "width=400,height=700");
  if (!ventana) return;
  ventana.document.write(html);
  ventana.document.close();
}
