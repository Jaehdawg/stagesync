import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

function slugifyUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function findAvailableUsername(base: string, supabase = createServiceClient()) {
  const root = base || 'singer'

  for (let index = 0; index < 10; index += 1) {
    const candidate = index === 0 ? root : `${root}-${index + 1}`
    const { data } = await supabase.from('profiles').select('id').eq('username', candidate).maybeSingle()
    if (!data) {
      return candidate
    }
  }

  return `${root}-${Date.now().toString(36)}`
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    firstName?: unknown
    lastName?: unknown
    email?: unknown
    password?: unknown
  }

  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!firstName || !lastName) {
    return NextResponse.json({ message: 'First name and last name are required.' }, { status: 400 })
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 })
  }

  if (!PASSWORD_REGEX.test(password)) {
    return NextResponse.json({ message: 'Password must be at least 8 characters and include a letter and a number.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const displayName = `${firstName} ${lastName}`.trim()
  const usernameBase = slugifyUsername(email.split('@')[0] || `${firstName}-${lastName}`)
  const username = await findAvailableUsername(usernameBase, supabase)

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      role: 'singer',
    },
  })

  if (createError || !createdUser.user) {
    return NextResponse.json({ message: createError?.message ?? 'Unable to create singer account.' }, { status: 500 })
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: createdUser.user.id,
      username,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return NextResponse.json({ message: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Singer account created.' }, { status: 201 })
}
