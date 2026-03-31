import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTestSession } from '@/lib/test-session'

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

async function isAuthorizedBandUser(request: NextRequest) {
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

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAuthorizedBandUser(request))) {
    return NextResponse.json({ message: 'Band access required.' }, { status: 401 })
  }

  const supabase = getSupabase(request)
  const { id } = await context.params
  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')

  const { data: currentItem, error: itemError } = await supabase
    .from('queue_items')
    .select('id, event_id, position, status')
    .eq('id', id)
    .maybeSingle()

  if (itemError || !currentItem) {
    return NextResponse.json({ message: 'Queue item not found.' }, { status: 404 })
  }

  if (action === 'played') {
    const { error } = await supabase.from('queue_items').update({ status: 'played' }).eq('id', id)
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
    return NextResponse.redirect(new URL('/band', request.url))
  }

  if (action === 'remove') {
    const { error } = await supabase.from('queue_items').update({ status: 'removed' }).eq('id', id)
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
    return NextResponse.redirect(new URL('/band', request.url))
  }

  if (action !== 'up' && action !== 'down') {
    return NextResponse.json({ message: 'Unknown action.' }, { status: 400 })
  }

  const { data: sibling } = await supabase
    .from('queue_items')
    .select('id, position')
    .eq('event_id', currentItem.event_id)
    .neq('id', currentItem.id)
    .order('position', { ascending: action === 'down' })
    .limit(1)
    .maybeSingle()

  if (!sibling) {
    return NextResponse.redirect(new URL('/band', request.url))
  }

  const firstId = action === 'up' ? currentItem.id : sibling.id
  const firstPosition = action === 'up' ? currentItem.position : sibling.position
  const secondId = action === 'up' ? sibling.id : currentItem.id
  const secondPosition = action === 'up' ? sibling.position : currentItem.position

  const { error: firstError } = await supabase.from('queue_items').update({ position: secondPosition }).eq('id', firstId)
  if (firstError) {
    return NextResponse.json({ message: firstError.message }, { status: 500 })
  }

  const { error: secondError } = await supabase.from('queue_items').update({ position: firstPosition }).eq('id', secondId)
  if (secondError) {
    return NextResponse.json({ message: secondError.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/band', request.url))
}
