import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'
import { buildCorsHeaders } from "../_shared/cors.ts";


interface TestUser {
  email: string
  password: string
  nombre: string
  apellido: string
  telefono: string
  direccion: string
  roles: string[]
  turno?: string
}

const testUsers: TestUser[] = [
  { email: 'admin@test.com', password: 'Test123456', nombre: 'Carlos', apellido: 'Administrador', telefono: '3001234567', direccion: 'Calle Admin 123', roles: ['admin_total'] },
  { email: 'mesero@test.com', password: 'Test123456', nombre: 'Juan', apellido: 'Mesero', telefono: '3007654321', direccion: 'Calle Mesero 456', roles: ['mesero'], turno: 'mañana' },
  { email: 'cocinero@test.com', password: 'Test123456', nombre: 'María', apellido: 'Cocinera', telefono: '3009876543', direccion: 'Calle Cocina 789', roles: ['cocina'], turno: 'tarde' },
  { email: 'cajero@test.com', password: 'Test123456', nombre: 'Pedro', apellido: 'Cajero', telefono: '3005551234', direccion: 'Calle Caja 321', roles: ['cajero'], turno: 'noche' },
  { email: 'adminsede@test.com', password: 'Test123456', nombre: 'Ana', apellido: 'Gerente', telefono: '3003334455', direccion: 'Calle Sede 654', roles: ['admin_sede'] },
  { email: 'meseroexterno@test.com', password: 'Test123456', nombre: 'Luis', apellido: 'Domicilios', telefono: '3008889999', direccion: 'Calle Externa 999', roles: ['mesero_externo'], turno: 'mañana' },
]

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // --- Auth validation: require admin_total role ---
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

    const callerUserId = claimsData.claims.sub as string
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: isAdminTotal } = await supabaseAdmin.rpc('has_role', { _user_id: callerUserId, _role: 'admin_total' })
    if (!isAdminTotal) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin_total role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    // --- End auth validation ---

    const results = []

    for (const testUser of testUsers) {
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
          user_metadata: { nombre: testUser.nombre, apellido: testUser.apellido },
        })

        if (authError) {
          if (authError.message.includes('already registered')) {
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
            if (listError) throw listError
            
            const existingUser = users.find(u => u.email === testUser.email)
            if (existingUser) {
              await supabaseAdmin.from('profiles').update({
                nombre: testUser.nombre, apellido: testUser.apellido,
                telefono: testUser.telefono, direccion: testUser.direccion,
                correo: testUser.email, turno: testUser.turno || null,
              }).eq('id', existingUser.id)

              await supabaseAdmin.from('user_roles').delete().eq('user_id', existingUser.id)

              for (const role of testUser.roles) {
                await supabaseAdmin.from('user_roles').insert({ user_id: existingUser.id, role })
              }

              results.push({ email: testUser.email, status: 'updated', userId: existingUser.id })
              continue
            }
          }
          throw authError
        }

        if (!authData.user) throw new Error('No se pudo crear el usuario')

        await supabaseAdmin.from('profiles').update({
          nombre: testUser.nombre, apellido: testUser.apellido,
          telefono: testUser.telefono, direccion: testUser.direccion,
          correo: testUser.email, turno: testUser.turno || null,
        }).eq('id', authData.user.id)

        for (const role of testUser.roles) {
          await supabaseAdmin.from('user_roles').insert({ user_id: authData.user.id, role })
        }

        results.push({ email: testUser.email, status: 'created', userId: authData.user.id })
      } catch (error: unknown) {
        results.push({ email: testUser.email, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Usuarios de prueba procesados', results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Error interno del servidor' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
