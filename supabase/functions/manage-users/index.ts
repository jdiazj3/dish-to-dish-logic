import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { buildCorsHeaders } from "../_shared/cors.ts";

const validRoles = ['admin_total', 'admin_sede', 'cajero', 'mesero', 'cocina', 'mesero_externo'] as const

const CreateUserSchema = z.object({
  action: z.literal('create'),
  email: z.string().email().max(255),
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  telefono: z.string().max(20).optional().nullable(),
  direccion: z.string().max(255).optional().nullable(),
  sede_id: z.string().uuid().optional().nullable(),
  turno: z.enum(['manana', 'tarde', 'noche']).optional().nullable(),
  roles: z.array(z.enum(validRoles)).min(1, 'At least one role required'),
})

const DeleteUserSchema = z.object({
  action: z.literal('delete'),
  userId: z.string().uuid(),
})


Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Validate JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const userId = claimsData.claims.sub as string

    // Check admin role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: userId })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()

    if (body.action === 'create') {
      const parsed = CreateUserSchema.safeParse(body)
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const { email, nombre, apellido, telefono, direccion, sede_id, turno, roles } = parsed.data

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { nombre, apellido },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      await supabaseAdmin.from('profiles').update({
        nombre, apellido,
        telefono: telefono || null,
        direccion: direccion || null,
        sede_id: sede_id || null,
        turno: turno || null,
      }).eq('id', authData.user.id)

      if (roles?.length > 0) {
        await supabaseAdmin.from('user_roles').insert(
          roles.map((role: string) => ({ user_id: authData.user.id, role }))
        )
      }

      return new Response(JSON.stringify({ success: true, user: { id: authData.user.id } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (body.action === 'delete') {
      const parsed = DeleteUserSchema.safeParse(body)
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const { userId: targetUserId } = parsed.data

      // Prevent self-deletion
      if (targetUserId === userId) {
        return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      await supabaseAdmin.from('user_roles').delete().eq('user_id', targetUserId)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: unknown) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
