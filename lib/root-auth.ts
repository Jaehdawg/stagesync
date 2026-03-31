export type RootAuthParams = {
  code?: string
  role?: string
  siteUrl?: string
}

export function buildRootAuthRedirect({ code, role, siteUrl }: RootAuthParams) {
  if (!code) {
    return null
  }

  const callbackUrl = new URL('/auth/callback', siteUrl || 'http://localhost:3000')
  callbackUrl.searchParams.set('code', code)

  if (role === 'band' || role === 'singer' || role === 'admin') {
    callbackUrl.searchParams.set('role', role)
  }

  return callbackUrl.toString()
}
