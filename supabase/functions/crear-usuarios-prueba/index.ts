import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  {
    email: 'admin@test.com',
    password: 'Test123456',
    nombre: 'Carlos',
    apellido: 'Administrador',
    telefono: '3001234567',
    direccion: 'Calle Admin 123',
    roles: ['admin_total']
  },
  {
    email: 'mesero@test.com',
    password: 'Test123456',
    nombre: 'Juan',
    apellido: 'Mesero',
    telefono: '3007654321',
    direccion: 'Calle Mesero 456',
    roles: ['mesero'],
    turno: 'mañana'
  },
  {
    email: 'cocinero@test.com',
    password: 'Test123456',
    nombre: 'María',
    apellido: 'Cocinera',
    telefono: '3009876543',
    direccion: 'Calle Cocina 789',
    roles: ['cocina'],
    turno: 'tarde'
  },
  {
    email: 'cajero@test.com',
    password: 'Test123456',
    nombre: 'Pedro',
    apellido: 'Cajero',
    telefono: '3005551234',
    direccion: 'Calle Caja 321',
    roles: ['cajero'],
    turno: 'noche'
  },
  {
    email: 'adminsede@test.com',
    password: 'Test123456',
    nombre: 'Ana',
    apellido: 'Gerente',
    telefono: '3003334455',
    direccion: 'Calle Sede 654',
    roles: ['admin_sede']
  }
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results = []

    for (const testUser of testUsers) {
      try {
        // Crear usuario en auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
          user_metadata: {
            nombre: testUser.nombre,
            apellido: testUser.apellido
          }
        })

        if (authError) {
          // Si el usuario ya existe, intentar obtenerlo
          if (authError.message.includes('already registered')) {
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
            if (listError) throw listError
            
            const existingUser = users.find(u => u.email === testUser.email)
            if (existingUser) {
              // Actualizar perfil
              const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({
                  nombre: testUser.nombre,
                  apellido: testUser.apellido,
                  telefono: testUser.telefono,
                  direccion: testUser.direccion,
                  correo: testUser.email,
                  turno: testUser.turno || null
                })
                .eq('id', existingUser.id)

              if (updateError) throw updateError

              // Eliminar roles existentes
              await supabaseAdmin
                .from('user_roles')
                .delete()
                .eq('user_id', existingUser.id)

              // Insertar nuevos roles
              for (const role of testUser.roles) {
                const { error: roleError } = await supabaseAdmin
                  .from('user_roles')
                  .insert({ user_id: existingUser.id, role })

                if (roleError) throw roleError
              }

              results.push({
                email: testUser.email,
                status: 'updated',
                userId: existingUser.id
              })
              continue
            }
          }
          throw authError
        }

        if (!authData.user) throw new Error('No se pudo crear el usuario')

        // Actualizar perfil
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            nombre: testUser.nombre,
            apellido: testUser.apellido,
            telefono: testUser.telefono,
            direccion: testUser.direccion,
            correo: testUser.email,
            turno: testUser.turno || null
          })
          .eq('id', authData.user.id)

        if (profileError) throw profileError

        // Asignar roles
        for (const role of testUser.roles) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: role
            })

          if (roleError) throw roleError
        }

        results.push({
          email: testUser.email,
          status: 'created',
          userId: authData.user.id
        })
      } catch (error: unknown) {
        results.push({
          email: testUser.email,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuarios de prueba procesados',
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: unknown) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
