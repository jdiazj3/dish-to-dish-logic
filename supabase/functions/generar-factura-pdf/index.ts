import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacturaRequest {
  facturaId: string;
  enviarCorreo?: boolean;
  correoDestino?: string;
}

const generarHTMLFactura = (factura: any, cajero: any, items: any[], config: any, qrUrl: string) => {
  // Agrupar items por silla
  const itemsPorSilla = items?.reduce((acc: any, item: any) => {
    const silla = item.numero_silla || 0;
    if (!acc[silla]) acc[silla] = [];
    acc[silla].push(item);
    return acc;
  }, {}) || {};

  const generarItemsHTML = () => {
    const sillas = Object.keys(itemsPorSilla).sort((a, b) => Number(a) - Number(b));
    
    if (sillas.length === 1 && sillas[0] === '0') {
      // Sin agrupación por sillas
      return items?.map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            ${item.producto_nombre}
            ${item.notas ? `<br><small style="color: #f59e0b; font-style: italic;">📝 ${item.notas}</small>` : ''}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.precio_unitario).toLocaleString('es-CO')}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.subtotal).toLocaleString('es-CO')}</td>
        </tr>
      `).join('') || '';
    }

    // Con agrupación por sillas
    return sillas.map(silla => {
      const sillaItems = itemsPorSilla[silla];
      const subtotalSilla = sillaItems.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);
      
      return `
        <tr>
          <td colspan="4" style="padding: 10px 8px 5px; background: #f5f5f5; font-weight: bold; border-bottom: 1px solid #ddd;">
            🪑 Silla ${silla} - Subtotal: $${subtotalSilla.toLocaleString('es-CO')}
          </td>
        </tr>
        ${sillaItems.map((item: any) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; padding-left: 20px;">
              ${item.producto_nombre}
              ${item.notas ? `<br><small style="color: #f59e0b; font-style: italic;">📝 ${item.notas}</small>` : ''}
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.precio_unitario).toLocaleString('es-CO')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.subtotal).toLocaleString('es-CO')}</td>
          </tr>
        `).join('')}
      `;
    }).join('');
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: letter; margin: 1cm; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; font-size: 12px; color: #666; }
        .factura-info { margin-bottom: 20px; }
        .factura-info table { width: 100%; }
        .factura-info td { padding: 5px 0; }
        .factura-info td:first-child { font-weight: bold; width: 150px; }
        table.items { width: 100%; border-collapse: collapse; margin: 20px 0; }
        table.items th { background: #333; color: white; padding: 10px; text-align: left; }
        table.items th:nth-child(2), table.items th:nth-child(3), table.items th:nth-child(4) { text-align: right; }
        .totales { margin-top: 20px; float: right; width: 300px; }
        .totales table { width: 100%; }
        .totales td { padding: 8px 0; }
        .totales td:first-child { text-align: right; padding-right: 20px; }
        .totales td:last-child { text-align: right; font-weight: bold; }
        .totales .total-final { border-top: 2px solid #333; font-size: 16px; padding-top: 10px; }
        .footer { clear: both; text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; }
        .qr-section { text-align: center; margin: 30px 0; }
        .qr-section img { width: 120px; height: 120px; }
        @media print {
          body { margin: 0; padding: 10mm; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${config?.logo_url ? `<img src="${config.logo_url}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;">` : ''}
        <h1>${config?.nombre || 'ANCESTRALE'}</h1>
        ${config?.direccion ? `<p>📍 ${config.direccion}</p>` : ''}
        ${config?.telefono ? `<p>📞 ${config.telefono}</p>` : ''}
      </div>

      <h2 style="text-align: center; margin: 20px 0; background: #f5f5f5; padding: 10px;">FACTURA DE VENTA</h2>

      <div class="factura-info">
        <table>
          <tr>
            <td>Factura No:</td>
            <td><strong>#${factura.consecutivo}</strong></td>
          </tr>
          <tr>
            <td>Fecha:</td>
            <td>${new Date(factura.created_at).toLocaleString('es-CO')}</td>
          </tr>
          <tr>
            <td>Cliente:</td>
            <td>${factura.nombre_cliente}</td>
          </tr>
          <tr>
            <td>Mesa:</td>
            <td>${factura.ordenes?.mesas?.numero || 'N/A'} - ${factura.ordenes?.mesas?.salones?.nombre || ''}</td>
          </tr>
          <tr>
            <td>Cajero:</td>
            <td>${cajero ? `${cajero.nombre} ${cajero.apellido}` : 'N/A'}</td>
          </tr>
        </table>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th>Producto</th>
            <th style="text-align: center;">Cant.</th>
            <th style="text-align: right;">P. Unit.</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${generarItemsHTML()}
        </tbody>
      </table>

      <div class="totales">
        <table>
          <tr>
            <td>Subtotal:</td>
            <td>$${Number(factura.subtotal).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>Impuestos (19%):</td>
            <td>$${Number(factura.impuestos).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>Propina:</td>
            <td>$${Number(factura.propina || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr class="total-final">
            <td>TOTAL:</td>
            <td>$${Number(factura.total).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
          </tr>
        </table>
      </div>

      <div class="qr-section">
        <img src="${qrUrl}" alt="Código QR"/>
        <p style="font-size: 11px; margin-top: 8px; color: #666;">Escanea para consultar</p>
      </div>

      <div class="footer">
        <p style="font-size: 18px; margin: 10px 0;"><strong>¡Gracias por su visita!</strong></p>
        ${config?.instagram ? `<p style="font-size: 12px;">📷 @${config.instagram.replace('@', '')}</p>` : ''}
        ${config?.pagina_web ? `<p style="font-size: 12px;">🌐 ${config.pagina_web}</p>` : ''}
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { facturaId, enviarCorreo, correoDestino }: FacturaRequest = await req.json();

    if (!facturaId) {
      throw new Error('ID de factura requerido');
    }

    console.log('Procesando factura:', facturaId);

    // Obtener datos de la factura
    const { data: factura, error: facturaError } = await supabase
      .from('facturas')
      .select(`
        *,
        ordenes(mesas(numero, salones(nombre)))
      `)
      .eq('id', facturaId)
      .single();

    if (facturaError || !factura) {
      throw new Error('Factura no encontrada');
    }

    // Obtener cajero
    const { data: cajero } = await supabase
      .from('profiles')
      .select('nombre, apellido')
      .eq('id', factura.cajero_id)
      .single();

    // Obtener items de la factura con notas y número de silla
    const { data: items } = await supabase
      .from('factura_items')
      .select('*, orden_productos(numero_silla, notas)')
      .eq('factura_id', facturaId);

    // Formatear items para incluir notas y número de silla
    const itemsFormateados = items?.map(item => ({
      ...item,
      numero_silla: item.orden_productos?.numero_silla || 0,
      notas: item.orden_productos?.notas || null
    })) || [];

    // Obtener configuración del restaurante
    const { data: config } = await supabase
      .from('configuracion_restaurante')
      .select('*')
      .limit(1)
      .single();

    // Generar URL del código QR
    const urlConsulta = `${supabaseUrl.replace('supabase.co', 'lovableproject.com')}/factura/${facturaId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(urlConsulta)}`;

    // Generar HTML de la factura
    const htmlFactura = generarHTMLFactura(factura, cajero, itemsFormateados, config, qrUrl);

    // Enviar por correo si se solicitó
    if (enviarCorreo && correoDestino) {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      
      console.log('Enviando factura por correo a:', correoDestino);

      await resend.emails.send({
        from: `${config?.nombre || 'Ancestrale'} <onboarding@resend.dev>`,
        to: [correoDestino],
        subject: `Factura #${factura.consecutivo} - ${config?.nombre || 'Ancestrale'}`,
        html: htmlFactura,
      });

      console.log('Correo enviado exitosamente');
    }

    return new Response(
      JSON.stringify({
        success: true,
        html: htmlFactura,
        mensaje: enviarCorreo ? 'Factura enviada por correo exitosamente' : 'Factura generada exitosamente',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error procesando factura:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error procesando factura' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
