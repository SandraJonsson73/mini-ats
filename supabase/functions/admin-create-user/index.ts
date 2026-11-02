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

// Engångslösenord utan tecken som lätt förväxlas (0/O, 1/l/I)
function generatePassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

Deno.serve(async (req) => {
  // Webbläsaren skickar en OPTIONS-förfrågan först (CORS)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // Dessa tre sätts automatiskt av Supabase i edge functions
  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // 1. Vem anropar? Klient som agerar som den inloggade användaren (RLS gäller)
  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: userData, error: userError } = await caller.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Inte inloggad' }, 401)

  // 2. Är anroparen admin? Återanvänder is_admin() från databasen
  const { data: isAdmin } = await caller.rpc('is_admin')
  if (isAdmin !== true) return json({ error: 'Endast admin får skapa konton' }, 403)

  // 3. Validera indata
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Ogiltig JSON' }, 400)
  }
  const email = String(body.email ?? '').trim().toLowerCase()
  const fullName = String(body.full_name ?? '').trim()
  const role = body.role
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'Ogiltig e-postadress' }, 400)
  if (role !== 'admin' && role !== 'customer') return json({ error: 'Ogiltig roll' }, 400)

  // Från och med här behövs full behörighet, så vi använder service role-klienten
  const admin = createClient(url, serviceKey)

  // 4. Organisation (bara för kunder): välj befintlig eller skapa ny
  let organizationId: string | null = null
  let createdOrgId: string | null = null
  if (role === 'customer') {
    const existingOrgId = String(body.organization_id ?? '').trim()
    const newOrgName = String(body.new_organization_name ?? '').trim()
    if (existingOrgId) {
      organizationId = existingOrgId
    } else if (newOrgName) {
      const { data: org, error } = await admin
        .from('organizations')
        .insert({ name: newOrgName })
        .select('id')
        .single()
      if (error) return json({ error: error.message }, 500)
      organizationId = createdOrgId = org.id
    } else {
      return json({ error: 'Kunder måste tillhöra en organisation' }, 400)
    }
  }

  // Ångra det vi hunnit skapa om något går fel längre ner
  const cleanupOrg = async () => {
    if (createdOrgId) await admin.from('organizations').delete().eq('id', createdOrgId)
  }

  // 5. Skapa inloggningen
  const password = generatePassword()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError || !created.user) {
    await cleanupOrg()
    return json({ error: createError?.message ?? 'Kunde inte skapa användaren' }, 400)
  }

  // 6. Skapa profilen (roll + organisation)
  const { error: profileError } = await admin.from('profiles').insert({
    id: created.user.id,
    email,
    full_name: fullName || null,
    role,
    organization_id: organizationId,
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    await cleanupOrg()
    return json({ error: profileError.message }, 500)
  }

  // Lösenordet returneras bara den här gången, så admin kan skicka det vidare
  return json({ user_id: created.user.id, email, password, organization_id: organizationId })
})
