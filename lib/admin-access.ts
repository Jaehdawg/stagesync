import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

export type AdminAccess = {
  source: 'live'
  username: string
  userId?: string
}

function createRequestClient(request: NextRequest) {
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

export async function getAdminAccess(supabase: any): Promise<AdminAccess | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase.from('profiles').select('id, username, email, role').eq('id', user.id).maybeSingle()

  if (profile?.role !== 'admin') {
    return null
  }

  return {
    source: 'live',
    username: profile.username?.trim() || profile.email?.trim() || user.email?.trim() || 'admin',
    userId: profile.id,
  }
}

export async function getRequestAdminAccess(request: NextRequest): Promise<AdminAccess | null> {
  return getAdminAccess(createRequestClient(request))
}
