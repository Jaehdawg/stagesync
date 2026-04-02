import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getTestSession } from '@/lib/test-session'
import { getTestLoginPasswordHash } from '@/lib/test-login'
import { getTestLogin } from '@/lib/test-login-list'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { createOrReuseAuthUser } from '@/lib/auth-admin'
import { upsertBandRole } from '@/lib/band-roles'

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

function usernameToEmail(username: string) {
  return `${username.toLowerCase().replace(/[^a-z0-9._-]+/g, '') || 'band-member'}@stagesync.local`
}

export async function POST(request: NextRequest) {
  const testSession = await getTestSession()
  const testSupabase = getSupabase(request)
  const serviceSupabase = createServiceClient()
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')

  if (testSession?.role === 'band') {
    const current = await getTestLogin(testSupabase, testSession.username)
    if (!current || current.role !== 'band' || current.band_access_level !== 'admin') {
      return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
    }

    const activeBandId = testSession.activeBandId ?? current.active_band_id ?? null
    if (!activeBandId) {
      return NextResponse.json({ message: 'No active band selected.' }, { status: 400 })
    }

    const username = String(formData.get('username') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const bandName = current.band_name ?? String(formData.get('bandName') ?? '').trim()

    try {
      if (action === 'delete') {
        await testSupabase.from('test_logins').delete().eq('username', username)
      } else if (action === 'upsert') {
        if (!username || !password) {
          return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 })
        }

        await testSupabase.from('test_logins').upsert({
          username: username.toLowerCase(),
          role: 'band',
          password_hash: getTestLoginPasswordHash(username, password),
          band_name: bandName || null,
          band_access_level: 'member',
          active_band_id: activeBandId,
        })

        await testSupabase.from('band_memberships').upsert(
          {
            band_id: activeBandId,
            member_type: 'test_login',
            member_key: username.toLowerCase(),
            band_access_level: 'member',
            active: true,
          },
          { onConflict: 'band_id,member_type,member_key' }
        )
      } else {
        return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
      }
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update member.' }, { status: 500 })
    }

    return NextResponse.redirect(new URL('/band/members', request.url))
  }

  const liveAccess = await getLiveBandAccessContext(testSupabase, serviceSupabase, { requireAdmin: true })
  if (!liveAccess) {
    return NextResponse.json({ message: 'Band admin access required.' }, { status: 403 })
  }

  const activeBandId = liveAccess.bandId
  const username = String(formData.get('username') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  try {
    if (action === 'delete') {
      const profileId = String(formData.get('profileId') ?? '').trim()
      if (profileId) {
        await serviceSupabase.from('band_roles').delete().eq('band_id', activeBandId).eq('profile_id', profileId)
        await serviceSupabase.from('band_memberships').delete().eq('band_id', activeBandId).eq('member_key', profileId)
        await serviceSupabase.from('profiles').delete().eq('id', profileId)
        await serviceSupabase.auth.admin.deleteUser(profileId)
      }
      return NextResponse.redirect(new URL('/band/members', request.url))
    }

    if (action !== 'upsert') {
      return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
    }

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 })
    }

    const { user: authUser, created } = await createOrReuseAuthUser(serviceSupabase, {
      email: usernameToEmail(username),
      password,
      user_metadata: { first_name: username, last_name: '', role: 'band' },
    })

    const profileId = authUser.id
    if (!created) {
      await serviceSupabase.auth.admin.updateUserById(profileId, { password, user_metadata: { username } })
    }

    const { error: profileError } = await serviceSupabase.from('profiles').upsert(
      {
        id: profileId,
        email: usernameToEmail(username),
        username,
        display_name: username,
        first_name: username,
        last_name: null,
        role: 'band',
        updated_at: new Date().toISOString(),
        active_band_id: activeBandId,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      return NextResponse.json({ message: profileError.message }, { status: 500 })
    }

    await upsertBandRole(serviceSupabase, activeBandId, profileId, 'member', true)
    await serviceSupabase.from('band_memberships').upsert(
      {
        band_id: activeBandId,
        member_type: 'profile',
        member_key: profileId,
        band_access_level: 'member',
        active: true,
      },
      { onConflict: 'band_id,member_type,member_key' }
    )

    return NextResponse.redirect(new URL('/band/members', request.url))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update member.' }, { status: 500 })
  }
}
