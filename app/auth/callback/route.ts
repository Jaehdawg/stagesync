import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { buildHomeUrl } from '@/lib/auth'
import { getRoleHomePath } from '@/lib/roles'
import { homeCopy } from '@/content/en/home'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const baseUrl = request.nextUrl.origin
  const requestedRole = request.nextUrl.searchParams.get('role')

  if (!code) {
    return NextResponse.redirect(buildHomeUrl(baseUrl, 'missing-code', homeCopy.authAlerts.missingCode))
  }

  const response = NextResponse.redirect(buildHomeUrl(baseUrl, 'success'))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(buildHomeUrl(baseUrl, 'error', error.message))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const firstName = user.user_metadata?.first_name ?? null
    const lastName = user.user_metadata?.last_name ?? null
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || user.email || 'StageSync user'
    const role = requestedRole === 'band' || requestedRole === 'admin' ? requestedRole : user.user_metadata?.role ?? 'singer'

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      role,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.redirect(new URL(getRoleHomePath(role), baseUrl))
  }

  return response
}
