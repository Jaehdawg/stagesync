import { NextResponse, type NextRequest } from 'next/server'
import {
  getTestLoginCookieName,
  getTestLoginPasswordHash,
  getTestLoginSeed,
  signTestSession,
  type TestLoginRole,
} from '@/lib/test-login'
import { createServiceClient } from '@/utils/supabase/service'
import { listBandsForTestLogin } from '@/lib/band-tenancy'

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

  const supabase = createServiceClient()

  const lookup = await supabase
    .from('test_logins')
    .select('username, role, password_hash, active_band_id')
    .eq('username', username)
    .eq('role', role)
    .maybeSingle()

  const tableMissing = lookup.error?.message?.includes('public.test_logins') || lookup.error?.code === 'PGRST205'
  const seededLogin = getTestLoginSeed(role, username)

  if (lookup.error && !tableMissing) {
    return NextResponse.json({ message: lookup.error.message }, { status: 500 })
  }

  const loginRow = lookup.data ?? (tableMissing ? seededLogin && {
    username: seededLogin.username,
    role: seededLogin.role,
    password_hash: getTestLoginPasswordHash(seededLogin.username, seededLogin.password),
    active_band_id: null,
  } : null)

  if (!loginRow) {
    return NextResponse.json({ message: `No ${role} account found for that username.` }, { status: 401 })
  }

  const passwordHash = getTestLoginPasswordHash(username, password)
  if (passwordHash !== loginRow.password_hash) {
    return NextResponse.json({ message: 'Incorrect password.' }, { status: 401 })
  }

  const accessibleBands = role === 'band'
    ? await listBandsForTestLogin(supabase, { role, username })
    : []
  const rememberedBandId = typeof loginRow.active_band_id === 'string' && loginRow.active_band_id.trim()
    ? loginRow.active_band_id.trim()
    : null
  const activeBandId = rememberedBandId && accessibleBands.some((band) => band.id === rememberedBandId)
    ? rememberedBandId
    : accessibleBands.length === 1
      ? accessibleBands[0].id
      : null

  if (activeBandId && role === 'band') {
    await supabase
      .from('test_logins')
      .update({ active_band_id: activeBandId })
      .eq('username', username)
      .eq('role', role)
  }

  const response = NextResponse.json({ message: `${role} login successful.` })
  response.cookies.set(getTestLoginCookieName(), signTestSession({ role, username, activeBandId }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  return response
}
