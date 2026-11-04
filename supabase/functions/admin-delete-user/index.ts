import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // 1. Vem anropar?
  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: userData, error: userError } = await caller.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Inte inloggad' }, 401)

  // 2. Är anroparen admin?
  const { data: isAdmin } = await caller.rpc('is_admin')
  if (isAdmin !== true) return json({ error: 'Endast admin får ta bort konton' }, 403)

  // 3. Vilken användare ska bort?
  let userId: string
  try {
    userId = String((await req.json()).user_id ?? '')
  } catch {
    return json({ error: 'Ogiltig JSON' }, 400)
  }
  if (!userId) return json({ error: 'user_id saknas' }, 400)
  if (userId === userData.user.id) {
    return json({ error: 'Du kan inte ta bort ditt eget konto' }, 400)
  }

  // 4. Ta bort användaren (profilen följer med via on delete cascade)
  const admin = createClient(url, serviceKey)
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return json({ error: error.message }, 400)

  return json({ ok: true })
})
