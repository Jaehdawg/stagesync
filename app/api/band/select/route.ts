import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getTestLoginCookieName, signTestSession } from '@/lib/test-login'
import { listBandsForTestLogin, setActiveBandForTestLogin } from '@/lib/band-tenancy'

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get(getTestLoginCookieName())?.value ?? null
  if (!sessionCookie) {
    return NextResponse.json({ message: 'Not signed in.' }, { status: 401 })
  }

  const session = JSON.parse(Buffer.from(sessionCookie, 'base64url').toString('utf8')) as {
    role?: 'admin' | 'band'
    username?: string
    activeBandId?: string | null
  }

  if (!session.role || !session.username) {
    return NextResponse.json({ message: 'Invalid session.' }, { status: 401 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  let body: any = null
  if (contentType.includes('application/json')) {
    body = await request.json().catch(() => null)
  } else {
    try {
      body = Object.fromEntries(await request.formData())
    } catch {
      body = null
    }
  }
  const bandId = typeof body?.bandId === 'string' && body.bandId.trim() ? body.bandId.trim() : null
  if (!bandId) {
    return NextResponse.json({ message: 'bandId is required.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const accessibleBands = session.role === 'admin'
    ? (await supabase.from('bands').select('id, band_name, created_at').order('band_name', { ascending: true })).data ?? []
    : await listBandsForTestLogin(supabase, { role: session.role, username: session.username })

  if (!accessibleBands.some((band) => band.id === bandId)) {
    return NextResponse.json({ message: 'You do not have access to that band.' }, { status: 403 })
  }

  if (session.role === 'band') {
    await setActiveBandForTestLogin(supabase, { username: session.username }, bandId)
  }

  const response = NextResponse.redirect(new URL('/band', request.url), 303)
  response.cookies.set(getTestLoginCookieName(), signTestSession({ role: session.role, username: session.username, activeBandId: bandId }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
