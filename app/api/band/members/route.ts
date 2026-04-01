import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTestSession } from '@/lib/test-session'
import { getTestLoginPasswordHash } from '@/lib/test-login'
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
  if (!activeBandId) {
    return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
  }

  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const bandName = current.band_name ?? String(formData.get('bandName') ?? '').trim()

  try {
    if (action === 'delete') {
      await supabase.from('test_logins').delete().eq('username', username)
    } else if (action === 'upsert') {
      if (!username || !password) {
        return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 })
      }

      await supabase.from('test_logins').upsert({
        username: username.toLowerCase(),
        role: 'band',
        password_hash: getTestLoginPasswordHash(username, password),
        band_name: bandName || null,
        band_access_level: 'member',
        active_band_id: activeBandId,
      })

      await supabase.from('band_memberships').upsert({
        band_id: activeBandId,
        member_type: 'test_login',
        member_key: username.toLowerCase(),
        band_access_level: 'member',
        active: true,
      }, { onConflict: 'band_id,member_type,member_key' })
    } else {
      return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update member.' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band/members', request.url))
}
