export function buildAuthCallbackUrl(baseUrl: string, role?: 'singer' | 'band' | 'admin') {
  const url = new URL('/auth/callback', baseUrl)

  if (role) {
    url.searchParams.set('role', role)
  }

  return url.toString()
}

export function buildHomeUrl(baseUrl: string, auth?: 'success' | 'error' | 'missing-code', message?: string) {
  const url = new URL('/', baseUrl)

  if (auth) {
    url.searchParams.set('auth', auth)
  }

  if (message) {
    url.searchParams.set('message', message)
  }

  return url.toString()
}
