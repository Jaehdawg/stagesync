import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getTestSession } from '@/lib/test-session'
import { getTestLoginPasswordHash, signTestSession } from '@/lib/test-login'
import { getTestLogin } from '@/lib/test-login-list'
import { getLiveBandAccessContext } from '@/lib/band-access'

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
  const testSupabase = getSupabase(request)
  const serviceSupabase = createServiceClient()
  const formData = await request.formData()
  const username = String(formData.get('username') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!username || !password) {
    return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 })
  }

  if (testSession?.role === 'band') {
    const current = await getTestLogin(serviceSupabase, testSession.username)
    if (!current || current.role !== 'band' || current.band_access_level !== 'admin') {
      return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
    }

    const activeBandId = testSession.activeBandId ?? current.active_band_id ?? null

    const { error } = await serviceSupabase
      .from('test_logins')
      .update({
        username,
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
      signTestSession({ role: 'band', username, activeBandId }),
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

  const liveAccess = await getLiveBandAccessContext(testSupabase, serviceSupabase, { requireAdmin: true })
  if (!liveAccess) {
    return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
  }

  const { error: profileError } = await serviceSupabase
    .from('profiles')
    .update({
      username,
      updated_at: new Date().toISOString(),
    })
    .eq('id', liveAccess.userId)

  if (profileError) {
    return NextResponse.json({ message: profileError.message }, { status: 500 })
  }

  const { error: authError } = await serviceSupabase.auth.admin.updateUserById(liveAccess.userId, {
    password,
    user_metadata: { username },
  })

  if (authError) {
    return NextResponse.json({ message: authError.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band/account', request.url))
}
