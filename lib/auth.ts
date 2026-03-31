export function buildAuthCallbackUrl(baseUrl: string) {
  return new URL('/auth/callback', baseUrl).toString()
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
