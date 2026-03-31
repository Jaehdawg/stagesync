import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTestLoginCookieName, getTestLoginPasswordHash, signTestSession, type TestLoginRole } from '@/lib/test-login'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

function normalizeRole(role: unknown): TestLoginRole | null {
  return role === 'band' || role === 'admin' ? role : null
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    role?: unknown
    username?: unknown
    password?: unknown
  }

  const role = normalizeRole(body.role)
  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!role || !username || !password) {
    return NextResponse.json({ message: 'Username, password, and role are required.' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
        },
      },
    }
  )

  const { data: loginRow, error } = await supabase
    .from('test_logins')
    .select('username, role, password_hash')
    .eq('username', username)
    .eq('role', role)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  if (!loginRow) {
    return NextResponse.json({ message: `No ${role} account found for that username.` }, { status: 401 })
  }

  const passwordHash = getTestLoginPasswordHash(username, password)
  if (passwordHash !== loginRow.password_hash) {
    return NextResponse.json({ message: 'Incorrect password.' }, { status: 401 })
  }

  const response = NextResponse.json({ message: `${role} login successful.` })
  response.cookies.set(getTestLoginCookieName(), signTestSession({ role, username }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  return response
}
