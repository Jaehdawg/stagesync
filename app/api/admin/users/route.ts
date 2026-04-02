import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '../../../../utils/supabase/service'
import { getRequestAdminAccess } from '../../../../lib/admin-access'
import { removeBandRole, upsertBandRole } from '../../../../lib/band-roles'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

function slugifyUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function findAvailableUsername(base: string, supabase: ReturnType<typeof createServiceClient>) {
  const root = base || 'user'

  for (let index = 0; index < 10; index += 1) {
    const candidate = index === 0 ? root : `${root}-${index + 1}`
    const { data } = await supabase.from('profiles').select('id').eq('username', candidate).maybeSingle()
    if (!data) {
      return candidate
    }
  }

  return `${root}-${Date.now().toString(36)}`
}

async function resolveBandId(supabase: ReturnType<typeof createServiceClient>, value: string) {
  const lookup = value.trim()
  if (!lookup) return null

  const { data: direct, error: directError } = await supabase.from('bands').select('id').eq('id', lookup).maybeSingle()
  if (directError) throw directError
  if (direct?.id) return direct.id as string

  const { data: byName, error: nameError } = await supabase.from('bands').select('id').ilike('band_name', lookup).maybeSingle()
  if (nameError) throw nameError
  return byName?.id ?? null
}

async function resolveProfileId(supabase: ReturnType<typeof createServiceClient>, formData: FormData) {
  let profileId = String(formData.get('profileId') ?? '').trim() || null
  const profileLookup = String(formData.get('profileLookup') ?? '').trim().toLowerCase()

  if (!profileId && profileLookup) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .or(`username.ilike.${profileLookup},display_name.ilike.${profileLookup},email.ilike.${profileLookup}`)
      .maybeSingle()

    if (error) {
      throw error
    }

    profileId = data?.id ?? null
  }

  return profileId
}

export async function POST(request: NextRequest) {
  const adminAccess = await getRequestAdminAccess(request)
  if (!adminAccess) {
    return NextResponse.json({ message: 'Admin login required.' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const formData = await request.formData()
  const action = String(formData.get('action') ?? 'create')

  try {
    if (action === 'delete') {
      const profileId = String(formData.get('profileId') ?? '').trim()
      if (!profileId) {
        return NextResponse.json({ message: 'Profile is required.' }, { status: 400 })
      }

      const { error: profileError } = await supabase.from('profiles').delete().eq('id', profileId)
      if (profileError) {
        return NextResponse.json({ message: profileError.message }, { status: 500 })
      }

      const { error: authError } = await supabase.auth.admin.deleteUser(profileId)
      if (authError) {
        return NextResponse.json({ message: authError.message }, { status: 500 })
      }

      return NextResponse.redirect(new URL('/admin/users', request.url))
    }

    if (action === 'remove-role') {
      const profileId = String(formData.get('profileId') ?? '').trim()
      const bandLookup = String(formData.get('bandLookup') ?? '').trim()
      const bandId = await resolveBandId(supabase, bandLookup)
      if (!profileId || !bandId) {
        return NextResponse.json({ message: 'Profile and band are required.' }, { status: 400 })
      }

      await removeBandRole(supabase, bandId, profileId)
      return NextResponse.redirect(new URL('/admin/users', request.url))
    }

    if (action !== 'create' && action !== 'update' && action !== 'add-role') {
      return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
    }

    const profileIdFromForm = await resolveProfileId(supabase, formData)
    const createMode = String(formData.get('createMode') ?? 'existing_profile')
    const role = String(formData.get('role') ?? 'singer')
    const bandRole = String(formData.get('bandRole') ?? 'member') === 'admin' ? 'admin' : 'member'
    const bandLookup = String(formData.get('bandLookup') ?? '').trim()
    const firstName = String(formData.get('firstName') ?? '').trim()
    const lastName = String(formData.get('lastName') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const usernameInput = String(formData.get('username') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const displayName = String(formData.get('displayName') ?? '').trim() || [firstName, lastName].filter(Boolean).join(' ')

    let profileId = profileIdFromForm

    if (createMode === 'new_user') {
      if (!firstName || !lastName) {
        return NextResponse.json({ message: 'First name and last name are required.' }, { status: 400 })
      }

      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 })
      }

      if (!PASSWORD_REGEX.test(password)) {
        return NextResponse.json({ message: 'Password must be at least 8 characters and include a letter and a number.' }, { status: 400 })
      }

      const usernameBase = slugifyUsername(usernameInput || email.split('@')[0] || `${firstName}-${lastName}`)
      const username = await findAvailableUsername(usernameBase, supabase)

      const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role,
        },
      })

      if (createError || !createdUser.user) {
        return NextResponse.json({ message: createError?.message ?? 'Unable to create user.' }, { status: 500 })
      }

      profileId = createdUser.user.id
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: createdUser.user.id,
          email,
          username,
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
          role,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

      if (profileError) {
        return NextResponse.json({ message: profileError.message }, { status: 500 })
      }
    } else if (profileId) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: profileId,
          email: email || null,
          username: usernameInput || null,
          display_name: displayName || null,
          first_name: firstName || null,
          last_name: lastName || null,
          role,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

      if (profileError) {
        return NextResponse.json({ message: profileError.message }, { status: 500 })
      }
    }

    if (!profileId) {
      return NextResponse.json({ message: 'Select a profile or create a new user.' }, { status: 400 })
    }

    const bandId = await resolveBandId(supabase, bandLookup)
    if (bandId && (action === 'create' || action === 'add-role' || action === 'update')) {
      await upsertBandRole(supabase, bandId, profileId, bandRole, true)
      const { error: activeBandError } = await supabase.from('profiles').update({ active_band_id: bandId }).eq('id', profileId)
      if (activeBandError) {
        return NextResponse.json({ message: activeBandError.message }, { status: 500 })
      }
    }

    return NextResponse.redirect(new URL('/admin/users', request.url))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update user.' }, { status: 500 })
  }
}
