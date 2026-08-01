import { format } from "date-fns";

type OrdenProducto = {
  cantidad: number;
  numero_silla: number;
  notas?: string | null;
  productos: { nombre: string } | null;
};

type OrdenData = {
  id: string;
  numero_orden?: number;
  created_at: string;
  es_domicilio?: boolean;
  instrucciones_entrega?: string | null;
  nombre_cliente?: string | null;
  mesas: { numero: number; salones: { nombre: string } } | null;
  orden_productos: OrdenProducto[];
};


function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generarHTMLComanda(orden: OrdenData): string {
  const esDomicilio = orden.es_domicilio;
  const fechaHora = format(new Date(orden.created_at), "dd/MM/yyyy HH:mm");
  
  // Agrupar productos por silla/persona
  const productosPorSilla = orden.orden_productos.reduce((acc, p) => {
    if (!acc[p.numero_silla]) {
      acc[p.numero_silla] = [];
    }
    acc[p.numero_silla].push(p);
    return acc;
  }, {} as Record<number, OrdenProducto[]>);

  const ubicacion = esDomicilio 
    ? `DOMICILIO - Ubicación ${escapeHtml(orden.mesas?.numero || 'N/A')}`
    : `Mesa ${escapeHtml(orden.mesas?.numero || 'N/A')} - ${escapeHtml(orden.mesas?.salones?.nombre || '')}`;

  let productosHTML = '';
  
  Object.entries(productosPorSilla).forEach(([silla, productos]) => {
    const sillaLabel = esDomicilio ? `Persona ${silla}` : `Silla ${silla}`;
    productosHTML += `
      <div class="silla-group">
        <div class="silla-header">${escapeHtml(sillaLabel)}</div>
        ${productos.map(p => `
          <div class="producto">
            <span class="cantidad">${escapeHtml(p.cantidad)}x</span>
            <span class="nombre">${escapeHtml(p.productos?.nombre || 'Producto')}</span>
          </div>
          ${p.notas ? `<div class="notas">📝 ${escapeHtml(p.notas)}</div>` : ''}
        `).join('')}
      </div>
    `;
  });

  const instruccionesHTML = esDomicilio && orden.instrucciones_entrega ? `
    <div class="instrucciones">
      <div class="instrucciones-title">📍 INSTRUCCIONES DE ENTREGA:</div>
      <div class="instrucciones-text">${escapeHtml(orden.instrucciones_entrega)}</div>
    </div>
  ` : '';

  const clienteHTML = orden.nombre_cliente ? `
    <div class="cliente">👤 ${escapeHtml(orden.nombre_cliente)}</div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Comanda #${escapeHtml(orden.numero_orden || 'N/A')}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 80mm;
          padding: 8px;
          background: white;
          color: black;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        
        .titulo {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .numero-orden {
          font-size: 32px;
          font-weight: bold;
          background: ${esDomicilio ? '#f97316' : '#000'};
          color: white;
          padding: 8px 16px;
          border-radius: 50%;
          display: inline-block;
          margin: 8px 0;
        }
        
        .tipo-orden {
          font-size: 16px;
          font-weight: bold;
          ${esDomicilio ? 'background: #fed7aa; padding: 4px 8px; border-radius: 4px;' : ''}
        }
        
        .fecha-hora {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
        }
        
        .ubicacion {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          padding: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        
        .cliente {
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .instrucciones {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 4px;
          padding: 8px;
          margin-bottom: 10px;
        }
        
        .instrucciones-title {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 4px;
        }
        
        .instrucciones-text {
          font-size: 12px;
        }
        
        .silla-group {
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 6px;
          margin-bottom: 8px;
        }
        
        .silla-header {
          font-weight: bold;
          font-size: 13px;
          background: #e5e7eb;
          padding: 4px 6px;
          margin: -6px -6px 6px -6px;
          border-radius: 4px 4px 0 0;
        }
        
        .producto {
          font-size: 14px;
          padding: 4px 0;
          border-bottom: 1px dotted #ccc;
        }
        
        .producto:last-of-type {
          border-bottom: none;
        }
        
        .cantidad {
          font-weight: bold;
          display: inline-block;
          width: 30px;
        }
        
        .nombre {
          font-weight: bold;
        }
        
        .notas {
          font-size: 11px;
          color: #d97706;
          font-style: italic;
          padding: 2px 0 4px 30px;
          border-bottom: 1px dotted #ccc;
        }
        
        .footer {
          text-align: center;
          border-top: 2px dashed #000;
          padding-top: 8px;
          margin-top: 10px;
          font-size: 10px;
        }
        
        .domicilio-badge {
          background: #f97316;
          color: white;
          font-size: 14px;
          font-weight: bold;
          padding: 6px 12px;
          border-radius: 4px;
          text-align: center;
          margin-bottom: 8px;
        }
        
        @media print {
          body {
            width: 80mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="titulo">ANCESTRALE</div>
        <div class="numero-orden">${escapeHtml(orden.numero_orden || 'N/A')}</div>
        <div class="tipo-orden">
          ${esDomicilio ? '🚚 DOMICILIO' : '🍽️ COMANDA'}
        </div>
        <div class="fecha-hora">${fechaHora}</div>
      </div>
      
      ${esDomicilio ? '<div class="domicilio-badge">🚚 PEDIDO EXTERNO</div>' : ''}
      
      <div class="ubicacion">${escapeHtml(ubicacion)}</div>
      
      ${clienteHTML}
      
      ${instruccionesHTML}
      
      ${productosHTML}
      
      <div class="footer">
        * * * * * * * * * * *
        <br>
        Impreso: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}
      </div>
    </body>
    </html>
  `;
}

export function imprimirComanda(orden: OrdenData): void {
  const html = generarHTMLComanda(orden);
  
  const ventana = window.open('', '_blank', 'width=320,height=600');
  if (ventana) {
    ventana.document.write(html);
    ventana.document.close();
    
    // Esperar a que cargue y luego imprimir
    setTimeout(() => {
      ventana.print();
    }, 300);
  }
}
