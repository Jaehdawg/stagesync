import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { buildHomeUrl } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const baseUrl = request.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(buildHomeUrl(baseUrl, 'missing-code', 'Missing auth code'))
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

  return response
}
