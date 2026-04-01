import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTestSession } from '@/lib/test-session'
import { getTestLoginPasswordHash, signTestSession } from '@/lib/test-login'
import { getTestLogin } from '@/lib/test-login-list'

function getSupabase(request: NextRequest) {
  return createServerClient(
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
}

export async function POST(request: NextRequest) {
  const testSession = await getTestSession()
  if (!testSession || testSession.role !== 'band') {
    return NextResponse.json({ message: 'Band test login required.' }, { status: 401 })
  }

  const supabase = getSupabase(request)
  const current = await getTestLogin(supabase, testSession.username)
  if (!current || current.role !== 'band' || current.band_access_level !== 'admin') {
    return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
  }

  const activeBandId = testSession.activeBandId ?? current.active_band_id ?? null

  const formData = await request.formData()
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!username || !password) {
    return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('test_logins')
    .update({
      username: username.toLowerCase(),
      password_hash: getTestLoginPasswordHash(username, password),
      band_name: current.band_name,
      band_access_level: 'admin',
      active_band_id: activeBandId,
    })
    .eq('username', current.username)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  const response = NextResponse.redirect(new URL('/band/account', request.url))
  response.cookies.set(
    'stagesync_test_session',
    signTestSession({ role: 'band', username: username.toLowerCase(), activeBandId }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    }
  )

  return response
}
