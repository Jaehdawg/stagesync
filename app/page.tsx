import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getRoleHomePath } from '@/lib/roles'
import { buildRootAuthRedirect } from '@/lib/root-auth'

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
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      {auth ? (
        <div className="mx-auto mb-6 max-w-5xl rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center text-sm text-cyan-100">
          {auth === 'success' ? 'Magic link confirmed. You’re signed in.' : null}
          {auth === 'missing-code' ? 'Missing auth code in the callback URL.' : null}
          {auth === 'error' ? `Sign-in issue: ${message ?? 'Unable to complete the login.'}` : null}
        </div>
      ) : null}

      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl items-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 sm:p-10 lg:p-14">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">StageSync</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            Karaoke queueing for singers, bands, and admins.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            StageSync keeps the room moving: singers join the queue, bands manage the show, and admins keep everything in sync.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/band"
              className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Learn more if you’re a band
            </Link>
            <a
              href="/band"
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-cyan-400/50 hover:bg-white/10"
            >
              Band portal
            </a>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            Need a singer sign-up link? Your band can generate one from the band dashboard.
          </p>
        </div>
      </section>
    </main>
  )
}
