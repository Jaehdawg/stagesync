export type AppRole = 'singer' | 'band' | 'admin'

export function normalizeRole(role: string | null | undefined): AppRole {
  if (role === 'band' || role === 'admin') {
    return role
  }

  return 'singer'
}

export function getRoleHomePath(role: string | null | undefined) {
  const normalized = normalizeRole(role)

  if (normalized === 'band') {
    return '/band'
  }

  if (normalized === 'admin') {
    return '/admin'
  }

  return '/'
}
