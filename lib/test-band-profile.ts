type SupabaseLike = {
  from: (table: string) => any
}

export type TestBandProfileRow = {
  id: string
  band_id?: string | null
  band_name: string
  website_url?: string | null
  instagram_url?: string | null
  youtube_url?: string | null
  tiktok_url?: string | null
  apple_music_url?: string | null
  spotify_url?: string | null
  facebook_url?: string | null
  twitch_url?: string | null
  x_url?: string | null
  paypal_url?: string | null
  venmo_url?: string | null
  cashapp_url?: string | null
  custom_message?: string | null
  created_at?: string | null
}

export type TestBandProfileInput = Partial<TestBandProfileRow> & {
  id?: string
  band_id?: string | null
  band_name: string
}

function normalizeBandId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

async function listByBandId(supabase: SupabaseLike, bandId: string) {
  const { data, error } = await supabase
    .from('test_band_profiles')
    .select('*')
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as TestBandProfileRow[]
}

export async function listTestBandProfiles(supabase: SupabaseLike, bandId?: string | null) {
  const normalizedBandId = normalizeBandId(bandId)
  if (normalizedBandId) {
    return listByBandId(supabase, normalizedBandId)
  }

  const { data, error } = await supabase
    .from('test_band_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as TestBandProfileRow[]
}

export async function getLatestTestBandProfile(supabase: SupabaseLike, bandId?: string | null) {
  const profiles = await listTestBandProfiles(supabase, bandId)
  return profiles[0] ?? null
}

export async function createTestBandProfile(supabase: SupabaseLike, profile: TestBandProfileInput) {
  const payload = {
    ...profile,
    band_id: normalizeBandId(profile.band_id),
  }

  const { data, error } = await supabase
    .from('test_band_profiles')
    .insert(payload)
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data ?? null) as TestBandProfileRow | null
}

export async function upsertTestBandProfile(supabase: SupabaseLike, profile: TestBandProfileInput) {
  const payload = {
    ...profile,
    band_id: normalizeBandId(profile.band_id),
  }

  const { data, error } = await supabase
    .from('test_band_profiles')
    .upsert(payload, { onConflict: 'band_name' })
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data ?? null) as TestBandProfileRow | null
}

export async function deleteTestBandProfile(supabase: SupabaseLike, id: string) {
  const { error } = await supabase.from('test_band_profiles').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteTestBandProfileById(supabase: SupabaseLike, id: string) {
  return deleteTestBandProfile(supabase, id)
}

export async function updateTestBandProfileById(
  supabase: SupabaseLike,
  id: string,
  profile: TestBandProfileInput
) {
  const payload = {
    ...profile,
    band_id: normalizeBandId(profile.band_id),
  }

  const { data, error } = await supabase
    .from('test_band_profiles')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data ?? null) as TestBandProfileRow | null
}

export async function deleteLatestTestBandProfile(supabase: SupabaseLike, bandId?: string | null) {
  const latest = await getLatestTestBandProfile(supabase, bandId)
  if (!latest) return
  await deleteTestBandProfile(supabase, latest.id)
}

export async function getTestBandProfileByBandId(supabase: SupabaseLike, bandId?: string | null) {
  return getLatestTestBandProfile(supabase, bandId)
}
