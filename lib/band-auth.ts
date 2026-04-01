import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { getTestSession } from './test-session'

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

export async function isBandAdminRequest(request: NextRequest) {
  const testSession = await getTestSession()
  if (testSession?.role === 'band' || testSession?.role === 'admin') {
    return true
  }

  const supabase = getSupabase(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return profile?.role === 'band' || profile?.role === 'admin'
}
