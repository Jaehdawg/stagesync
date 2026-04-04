type QueryResult = {
  data: Record<string, unknown> | null
  error: { message: string } | null
}

type FilterQueryBuilder = {
  eq: (...args: unknown[]) => FilterQueryBuilder
  maybeSingle: () => Promise<QueryResult>
}

type TableQueryBuilder = {
  select: (...args: unknown[]) => FilterQueryBuilder
}

type BandTidalSupabase = {
  from: (table: string) => TableQueryBuilder
}

export type BandTidalCredentials = {
  clientId: string | null
  clientSecret: string | null
}

function normalizeBandId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeCredential(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

async function readCredentialsFromTable(supabase: BandTidalSupabase, table: string, bandId: string): Promise<BandTidalCredentials | null> {
  const { data, error } = await supabase
    .from(table)
    .select('tidal_client_id, tidal_client_secret')
    .eq('band_id', bandId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    clientId: normalizeCredential(data.tidal_client_id),
    clientSecret: normalizeCredential(data.tidal_client_secret),
  }
}

export async function getBandTidalCredentials(supabase: unknown, bandIdInput: unknown): Promise<BandTidalCredentials | null> {
  const bandId = normalizeBandId(bandIdInput)
  if (!bandId) return null

  const client = supabase as BandTidalSupabase
  const bandProfile = await readCredentialsFromTable(client, 'band_profiles', bandId)
  if (bandProfile?.clientId || bandProfile?.clientSecret) {
    return bandProfile
  }

  const testBandProfile = await readCredentialsFromTable(client, 'test_band_profiles', bandId)
  return testBandProfile
}
