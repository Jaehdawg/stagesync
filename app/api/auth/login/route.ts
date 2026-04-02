import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function normalizeRole(role: unknown) {
  return role === 'band' || role === 'admin' ? role : null
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    role?: unknown
    username?: unknown
    password?: unknown
  }

  const role = normalizeRole(body.role)
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!role || !username || !password) {
    return NextResponse.json({ message: 'Username, password, and role are required.' }, { status: 400 })
  }

  const response = NextResponse.json({ message: `${role} login successful.` })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const lookup = await supabase
    .from('profiles')
    .select('id, username, email, role')
    .eq('username', username)
    .eq('role', role)
    .maybeSingle()

  if (lookup.error && lookup.error.message && !lookup.error.message.includes('JSON object requested')) {
    return NextResponse.json({ message: lookup.error.message }, { status: 500 })
  }

  const profile = lookup.data ?? null
  if (!profile?.email) {
    return NextResponse.json({ message: `No ${role} account found for that username.` }, { status: 401 })
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  })

  if (signInError) {
    return NextResponse.json({ message: signInError.message }, { status: 401 })
  }

  return response
}
