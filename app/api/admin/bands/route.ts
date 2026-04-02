import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '../../../../utils/supabase/service'
import { getRequestAdminAccess } from '../../../../lib/admin-access'
import { createOrReuseAuthUser } from '../../../../lib/auth-admin'
import { upsertBandRole } from '../../../../lib/band-roles'

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
  const root = base || 'band-admin'

  for (let index = 0; index < 10; index += 1) {
    const candidate = index === 0 ? root : `${root}-${index + 1}`
    const { data } = await supabase.from('profiles').select('id').eq('username', candidate).maybeSingle()
    if (!data) {
      return candidate
    }
  }

  return `${root}-${Date.now().toString(36)}`
}

async function resolveOrCreateBand(supabase: ReturnType<typeof createServiceClient>, bandName: string) {
  const { data: existingBand, error: lookupError } = await supabase.from('bands').select('id, band_name').ilike('band_name', bandName).maybeSingle()
  if (lookupError) {
    throw lookupError
  }

  if (existingBand?.id) {
    return { band: existingBand, created: false }
  }

  const { data: createdBand, error: createError } = await supabase
    .from('bands')
    .insert({ band_name: bandName })
    .select('id, band_name')
    .maybeSingle()

  if (createError) {
    throw createError
  }

  return { band: createdBand ?? null, created: true }
}

function createFailureResponse(step: string, error: unknown, status = 500) {
  console.error('[admin/bands]', step, error)
  const message = error instanceof Error ? error.message : String(error)
  return NextResponse.json({ message: `${step}: ${message}` }, { status })
}

async function rollbackBandCreation(supabase: ReturnType<typeof createServiceClient>, bandId: string | null, profileId: string | null, authUserCreated = false) {
  if (!bandId) {
    if (profileId) {
      await supabase.from('profiles').delete().eq('id', profileId)
      if (authUserCreated) {
        await supabase.auth.admin.deleteUser(profileId)
      }
    }
    return
  }

  await Promise.all([
    supabase.from('band_roles').delete().eq('band_id', bandId),
    supabase.from('band_memberships').delete().eq('band_id', bandId),
    supabase.from('band_profiles').delete().eq('band_id', bandId),
    supabase.from('bands').delete().eq('id', bandId),
  ])

  if (profileId) {
    await supabase.from('profiles').delete().eq('id', profileId)
    await supabase.auth.admin.deleteUser(profileId)
  }
}

async function upsertBandProfileRecord(
  supabase: ReturnType<typeof createServiceClient>,
  bandId: string,
  bandName: string,
  profileId: string,
  fields: Record<string, string | null>
) {
  const { error } = await supabase.from('band_profiles').upsert(
    {
      band_id: bandId,
      profile_id: profileId,
      band_name: bandName,
      website_url: fields.website_url,
      facebook_url: fields.facebook_url,
      instagram_url: fields.instagram_url,
      tiktok_url: fields.tiktok_url,
      paypal_url: fields.paypal_url,
      venmo_url: fields.venmo_url,
      cashapp_url: fields.cashapp_url,
      custom_message: fields.custom_message,
      logo_url: fields.logo_url,
    },
    { onConflict: 'band_id' }
  )

  if (error) {
    throw new Error(error.message)
  }
}

async function upsertBandMembershipRecord(
  supabase: ReturnType<typeof createServiceClient>,
  bandId: string,
  profileId: string,
  bandRole: 'admin' | 'member'
) {
  const { error } = await supabase.from('band_memberships').upsert(
    {
      band_id: bandId,
      member_type: 'profile',
      member_key: profileId,
      band_access_level: bandRole,
      active: true,
    },
    { onConflict: 'band_id,member_type,member_key' }
  )

  if (error) {
    throw new Error(error.message)
  }
}

export async function POST(request: NextRequest) {
  const adminAccess = await getRequestAdminAccess(request)
  if (!adminAccess) {
    return NextResponse.json({ message: 'Admin login required.' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const formData = await request.formData()
  const action = String(formData.get('action') ?? 'create')

  let createdBandId: string | null = null
  let createdProfileId: string | null = null
  let createdAuthUser = false

  try {
    if (action !== 'create') {
      return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
    }

    const bandName = String(formData.get('bandName') ?? '').trim()
    if (!bandName) {
      return NextResponse.json({ message: 'Band name is required.' }, { status: 400 })
    }

    const createMode = String(formData.get('createMode') ?? 'existing_profile')
    const bandRole = String(formData.get('bandRole') ?? 'admin') === 'member' ? 'member' : 'admin'
    const bandResult = await resolveOrCreateBand(supabase, bandName)
    const band = bandResult.band
    createdBandId = bandResult.created ? band?.id ?? null : null

    if (!band?.id) {
      return NextResponse.json({ message: 'Unable to resolve band.' }, { status: 500 })
    }

    const profileFields = {
      logo_url: String(formData.get('logoUrl') ?? '').trim() || null,
      website_url: String(formData.get('websiteUrl') ?? '').trim() || null,
      facebook_url: String(formData.get('facebookUrl') ?? '').trim() || null,
      instagram_url: String(formData.get('instagramUrl') ?? '').trim() || null,
      tiktok_url: String(formData.get('tiktokUrl') ?? '').trim() || null,
      paypal_url: String(formData.get('paypalUrl') ?? '').trim() || null,
      venmo_url: String(formData.get('venmoUrl') ?? '').trim() || null,
      cashapp_url: String(formData.get('cashappUrl') ?? '').trim() || null,
      custom_message: String(formData.get('customMessage') ?? '').trim() || null,
    }

    let profileId = String(formData.get('profileId') ?? '').trim() || null
    const profileLookup = String(formData.get('profileLookup') ?? '').trim().toLowerCase()

    if (!profileId && profileLookup) {
      const { data: foundProfile, error: profileLookupError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', profileLookup)
        .maybeSingle()

      if (profileLookupError) {
        await rollbackBandCreation(supabase, createdBandId, null)
        return createFailureResponse('profile lookup failed', profileLookupError)
      }

      profileId = foundProfile?.id ?? null
    }

    if (createMode === 'new_user') {
      const firstName = String(formData.get('firstName') ?? '').trim()
      const lastName = String(formData.get('lastName') ?? '').trim()
      const email = String(formData.get('email') ?? '').trim().toLowerCase()
      const password = String(formData.get('password') ?? '')
      const usernameBase = slugifyUsername(String(formData.get('username') ?? email.split('@')[0] ?? `${firstName}-${lastName}`))

      if (!firstName || !lastName) {
        await rollbackBandCreation(supabase, createdBandId, null)
        return NextResponse.json({ message: 'First name and last name are required.' }, { status: 400 })
      }

      if (!EMAIL_REGEX.test(email)) {
        await rollbackBandCreation(supabase, createdBandId, null)
        return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 })
      }

      if (!PASSWORD_REGEX.test(password)) {
        await rollbackBandCreation(supabase, createdBandId, null)
        return NextResponse.json({ message: 'Password must be at least 8 characters and include a letter and a number.' }, { status: 400 })
      }

      const username = await findAvailableUsername(usernameBase, supabase)
      const { user: createdUser, created: authUserCreated } = await createOrReuseAuthUser(supabase, {
        email,
        password,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: 'band',
        },
      })

      createdAuthUser = authUserCreated
      profileId = createdUser.id
      createdProfileId = createdUser.id
      const displayName = `${firstName} ${lastName}`.trim()
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: createdUser.id,
          email,
          username,
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
          role: 'band',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

      if (profileError) {
        await rollbackBandCreation(supabase, createdBandId, createdProfileId, createdAuthUser)
        return createFailureResponse('profile upsert failed', profileError)
      }
    }

    if (!profileId) {
      await rollbackBandCreation(supabase, createdBandId, createdProfileId, createdAuthUser)
      return NextResponse.json({ message: 'Select a profile or create a new band admin.' }, { status: 400 })
    }

    await upsertBandProfileRecord(supabase, band.id, band.band_name, profileId, profileFields)

    const { error: roleError } = await supabase.from('band_roles').upsert(
      {
        band_id: band.id,
        profile_id: profileId,
        band_role: bandRole,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'band_id,profile_id' }
    )

    if (roleError) {
      await rollbackBandCreation(supabase, createdBandId, createdProfileId, createdAuthUser)
      return createFailureResponse('band role upsert failed', roleError)
    }

    try {
      await upsertBandMembershipRecord(supabase, band.id, profileId, bandRole)
    } catch (membershipError) {
      await rollbackBandCreation(supabase, createdBandId, createdProfileId, createdAuthUser)
      return createFailureResponse('band membership upsert failed', membershipError)
    }

    return NextResponse.redirect(new URL('/admin/bands', request.url))
  } catch (error) {
    await rollbackBandCreation(supabase, createdBandId, createdProfileId, createdAuthUser)
    return createFailureResponse('band creation failed', error)
  }
}
