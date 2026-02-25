import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AlertaRequest {
  margenActual: number;
  margenMinimo: number;
  totalInversion: number;
  totalVentas: number;
  ganancia: number;
  periodo: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // --- Auth validation ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const callerUserId = claimsData.claims.sub as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: callerUserId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // --- End auth validation ---

    const { margenActual, margenMinimo, totalInversion, totalVentas, ganancia, periodo }: AlertaRequest = await req.json();

    const { data: config, error: configError } = await supabase
      .from("alertas_rentabilidad_config")
      .select("email_admin")
      .single();

    if (configError || !config?.email_admin) {
      return new Response(
        JSON.stringify({ message: "No hay email configurado" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const esNegativo = ganancia < 0;
    const colorMargen = esNegativo ? "#dc3545" : "#ffc107";
    const iconoEstado = esNegativo ? "📉" : "⚠️";

    const emailResponse = await resend.emails.send({
      from: "Alertas Sistema <onboarding@resend.dev>",
      to: [config.email_admin],
      subject: `${iconoEstado} Alerta: Margen de ganancia bajo (${margenActual.toFixed(1)}%)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b, #ee5a5a); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .stat-box { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #007bff; }
            .stat-label { color: #666; font-size: 14px; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .negative { color: #dc3545; }
            .warning { color: #ffc107; }
            .positive { color: #28a745; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${iconoEstado} Alerta de Rentabilidad</h1>
              <p>Se ha detectado un margen de ganancia por debajo del umbral configurado</p>
            </div>
            <div class="content">
              <div class="stat-box"><div class="stat-label">Período analizado</div><div class="stat-value">${periodo}</div></div>
              <div class="stat-box"><div class="stat-label">Margen actual vs Mínimo configurado</div><div class="stat-value" style="color: ${colorMargen};">${margenActual.toFixed(1)}% vs ${margenMinimo}%</div></div>
              <div class="stat-box"><div class="stat-label">Inversión total</div><div class="stat-value negative">${formatCurrency(totalInversion)}</div></div>
              <div class="stat-box"><div class="stat-label">Ventas totales</div><div class="stat-value positive">${formatCurrency(totalVentas)}</div></div>
              <div class="stat-box"><div class="stat-label">${esNegativo ? 'Pérdida' : 'Ganancia'}</div><div class="stat-value ${esNegativo ? 'negative' : 'warning'}">${formatCurrency(Math.abs(ganancia))}</div></div>
              <p style="margin-top: 20px;"><strong>Recomendación:</strong> Revise los costos de inventario y las estrategias de precios para mejorar el margen de rentabilidad.</p>
            </div>
            <div class="footer">
              <p>Este es un correo automático generado por el sistema de alertas.</p>
              <p>Puede configurar el umbral de margen mínimo desde el panel de administración.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email de alerta enviado:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error en alerta-margen-bajo:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
