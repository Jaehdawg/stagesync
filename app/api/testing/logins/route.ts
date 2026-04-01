import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTestSession } from '@/lib/test-session'
import { getTestLoginPasswordHash } from '@/lib/test-login'

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
  if (!testSession || testSession.role !== 'admin') {
    return NextResponse.json({ message: 'Admin test login required.' }, { status: 401 })
  }

  const supabase = getSupabase(request)
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')
  const username = String(formData.get('username') ?? '').trim()
  const role = String(formData.get('role') ?? '')
  const password = String(formData.get('password') ?? '')
  const bandName = String(formData.get('bandName') ?? '').trim()
  const bandAccessLevel = String(formData.get('bandAccessLevel') ?? 'admin')

  try {
    if (action === 'delete') {
      await supabase.from('test_logins').delete().eq('username', username)
    } else if (action === 'upsert') {
      if (role !== 'singer' && role !== 'band' && role !== 'admin') {
        return NextResponse.json({ message: 'Role must be singer, band, or admin.' }, { status: 400 })
      }

      let activeBandId: string | null = null

      if (role === 'band') {
        if (!bandName) {
          return NextResponse.json({ message: 'Band name is required for band logins.' }, { status: 400 })
        }

        const bandLookup = await supabase
          .from('bands')
          .select('id')
          .ilike('band_name', bandName)
          .maybeSingle()

        if (bandLookup.error) {
          return NextResponse.json({ message: bandLookup.error.message }, { status: 500 })
        }

        if (bandLookup.data?.id) {
          activeBandId = bandLookup.data.id
        } else {
          const createdBand = await supabase
            .from('bands')
            .insert({ band_name: bandName })
            .select('id')
            .maybeSingle()

          if (createdBand.error) {
            return NextResponse.json({ message: createdBand.error.message }, { status: 500 })
          }

          activeBandId = createdBand.data?.id ?? null
        }

        if (activeBandId) {
          const membership = await supabase.from('band_memberships').upsert(
            {
              band_id: activeBandId,
              member_type: 'test_login',
              member_key: username.toLowerCase(),
              band_access_level: bandAccessLevel === 'member' ? 'member' : 'admin',
              active: true,
            },
            { onConflict: 'band_id,member_type,member_key' }
          )

          if (membership.error) {
            return NextResponse.json({ message: membership.error.message }, { status: 500 })
          }
        }
      }

      await supabase.from('test_logins').upsert({
        username: username.toLowerCase(),
        role,
        password_hash: getTestLoginPasswordHash(username, password),
        band_name: role === 'band' ? bandName || null : null,
        band_access_level: role === 'band' ? (bandAccessLevel === 'member' ? 'member' : 'admin') : null,
        active_band_id: role === 'band' ? activeBandId : null,
      })
    } else {
      return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update login.' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/admin', request.url))
}
