import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTestSession } from '@/lib/test-session'
import { getTestLoginPasswordHash } from '@/lib/test-login'

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

export async function POST(request: NextRequest) {
  const testSession = await getTestSession()
  if (!testSession || testSession.role !== 'admin') {
    return NextResponse.json({ message: 'Admin test login required.' }, { status: 401 })
  }

  const supabase = getSupabase(request)
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')
  const username = String(formData.get('username') ?? '').trim()
  const role = String(formData.get('role') ?? '')
  const password = String(formData.get('password') ?? '')

  try {
    if (action === 'delete') {
      await supabase.rpc('test_delete_login', { p_username: username })
    } else if (action === 'upsert') {
      if (role !== 'band' && role !== 'admin') {
        return NextResponse.json({ message: 'Role must be band or admin.' }, { status: 400 })
      }

      await supabase.rpc('test_upsert_login', {
        p_username: username,
        p_role: role,
        p_password_hash: getTestLoginPasswordHash(username, password),
      })
    } else {
      return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update login.' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/admin', request.url))
}
