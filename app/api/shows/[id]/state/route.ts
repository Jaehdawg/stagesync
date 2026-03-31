import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

async function getAuthenticatedBandUser(request: NextRequest) {
  const supabase = createServerClient(
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null }
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()

  if (profile?.role !== 'band' && profile?.role !== 'admin') {
    return { supabase, user: null }
  }

  return { supabase, user }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { supabase, user } = await getAuthenticatedBandUser(request)
  const { id } = await context.params
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')
  const referer = request.headers.get('referer') ?? new URL('/band', request.url).toString()

  if (!user) {
    return NextResponse.redirect(new URL('/band', request.url))
  }

  const update: Record<string, unknown> = {}

  switch (action) {
    case 'start':
      update.is_active = true
      update.allow_signups = true
      update.ended_at = null
      break
    case 'pause':
      update.is_active = true
      update.allow_signups = false
      break
    case 'resume':
      update.is_active = true
      update.allow_signups = true
      break
    case 'end':
      update.is_active = false
      update.allow_signups = false
      update.ended_at = new Date().toISOString()
      break
    default:
      return NextResponse.redirect(referer)
  }

  const { error } = await supabase.from('events').update(update).eq('id', id)

  if (error) {
    return NextResponse.redirect(new URL(`/band?error=${encodeURIComponent(error.message)}`, request.url))
  }

  return NextResponse.redirect(referer)
}
