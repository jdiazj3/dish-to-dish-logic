import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";

const RequestSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  celular: z.string().trim().regex(/^\+?[0-9\s()-]{7,20}$/),
  email: z.string().trim().email().max(255),
  website: z.string().max(200).optional(),
}).strict();

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char] ?? char));

serve(async (req) => {
  const headers = { ...buildCorsHeaders(req), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST" || !isAllowedOrigin(req.headers.get("origin"))) {
    return new Response(JSON.stringify({ error: "Solicitud no permitida" }), { status: 403, headers });
  }
  try {
    if (Number(req.headers.get("content-length") ?? 0) > 4096) {
      return new Response(JSON.stringify({ error: "Solicitud demasiado grande" }), { status: 413, headers });
    }
    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: "Datos inválidos" }), { status: 400, headers });
    if (parsed.data.website) return new Response(JSON.stringify({ success: true }), { headers });

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("Correo no configurado");
    const { nombre, celular, email } = parsed.data;
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Ancestrale Cloud <info@ancestralecloud.top>",
      to: ["info@ancestralecloud.top"],
      reply_to: email,
      subject: "Nueva solicitud de información - Ancestrale Cloud",
      html: `<h2>Nueva solicitud de información</h2><p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p><p><strong>Celular:</strong> ${escapeHtml(celular)}</p><p><strong>Correo:</strong> ${escapeHtml(email)}</p>`,
    });
    if (error) throw new Error("No se pudo entregar el correo");
    return new Response(JSON.stringify({ success: true }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: "No se pudo enviar la solicitud" }), { status: 500, headers });
  }
});
