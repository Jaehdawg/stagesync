import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getRoleHomePath } from '@/lib/roles'
import { buildRootAuthRedirect } from '@/lib/root-auth'
import { homeCopy } from '@/content/en/home'
import { HomepageLanding } from '@/components/homepage-landing'

type SearchParams = Record<string, string | string[] | undefined>

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const auth = typeof params?.auth === 'string' ? params.auth : undefined
  const message = typeof params?.message === 'string' ? params.message : undefined
  const code = typeof params?.code === 'string' ? params.code : undefined
  const role = typeof params?.role === 'string' ? params.role : undefined
  const band = typeof params?.band === 'string' ? params.band : undefined
  const show = typeof params?.show === 'string' ? params.show : undefined

  const requestHeaders = await headers()
  const forwardedProto = requestHeaders.get('x-forwarded-proto') ?? 'https'
  const forwardedHost = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const siteUrl = requestHeaders.get('origin') ?? (forwardedHost ? `${forwardedProto}://${forwardedHost}` : undefined)

  const authRedirect = buildRootAuthRedirect({
    code,
    role,
    siteUrl: siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? 'https://stagesync-six.vercel.app',
  })

  if (authRedirect) {
    redirect(authRedirect)
  }

  if (band || show) {
    const singerUrl = new URL('/singer', siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? 'https://stagesync-six.vercel.app')
    if (band) singerUrl.searchParams.set('band', band)
    if (show) singerUrl.searchParams.set('show', show)
    redirect(singerUrl.toString())
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const target = getRoleHomePath(profile?.role)

    if (target !== '/') {
      redirect(target)
    }
  }

  return (
    <>
      {auth ? (
        <div className="mx-auto mt-6 max-w-7xl rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center text-sm text-cyan-100">
          {auth === 'success' ? homeCopy.authAlerts.success : null}
          {auth === 'missing-code' ? homeCopy.authAlerts.missingCode : null}
          {auth === 'error' ? `${homeCopy.authAlerts.errorPrefix} ${message ?? homeCopy.authAlerts.errorFallback}` : null}
        </div>
      ) : null}

      <HomepageLanding />
    </>
  )
}
