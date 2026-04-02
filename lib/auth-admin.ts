type AuthUser = {
  id: string
  email?: string | null
}

type SupabaseAuthAdmin = {
  createUser: (input: {
    email: string
    password: string
    email_confirm?: boolean
    user_metadata?: Record<string, unknown>
  }) => Promise<{ data: { user: AuthUser | null } | null; error: { message?: string } | null }>
  updateUserById: (
    id: string,
    input: {
      password?: string
      email_confirm?: boolean
      user_metadata?: Record<string, unknown>
    }
  ) => Promise<{ data: { user: AuthUser | null } | null; error: { message?: string } | null }>
  listUsers: (input?: { page?: number; perPage?: number }) => Promise<{ data?: { users?: AuthUser[] } | AuthUser[]; error: { message?: string } | null }>
}

type SupabaseAuthClient = {
  auth: {
    admin: SupabaseAuthAdmin
  }
}

function isDuplicateEmailError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  return /already been registered|already exists|duplicate key/i.test(message)
}

async function findAuthUserByEmail(supabase: SupabaseAuthClient, email: string) {
  const normalizedEmail = email.trim().toLowerCase()

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
    if (error) {
      throw new Error(error.message ?? 'Unable to list auth users.')
    }

    const users = Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
        ? data.users
        : []

    const match = users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail)
    if (match) {
      return match
    }

    if (users.length < 100) {
      break
    }
  }

  return null
}

export async function createOrReuseAuthUser(
  supabase: SupabaseAuthClient,
  input: {
    email: string
    password: string
    user_metadata?: Record<string, unknown>
  }
) {
  const created = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: input.user_metadata,
  })

  if (created.data?.user) {
    return { user: created.data.user, created: true }
  }

  if (created.error && isDuplicateEmailError(created.error)) {
    const existing = await findAuthUserByEmail(supabase, input.email)
    if (!existing) {
      throw new Error(created.error.message ?? 'A user with this email address has already been registered')
    }

    const updated = await supabase.auth.admin.updateUserById(existing.id, {
      password: input.password,
      email_confirm: true,
      user_metadata: input.user_metadata,
    })

    if (updated.error) {
      throw new Error(updated.error.message ?? 'Unable to update existing auth user.')
    }

    return { user: updated.data?.user ?? existing, created: false }
  }

  throw new Error(created.error?.message ?? 'Unable to create auth user.')
}
