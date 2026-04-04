import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { BandAccessForm } from '@/components/band-access-form'
import { getTestSession } from '@/lib/test-session'
import { getTestLogin } from '@/lib/test-login-list'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { getBandProfileForBandId } from '@/lib/band-tenancy'
import { bandCopy } from '@/content/en/band'

function LoginCard({ title, description }: { title: string; description: string }) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{bandCopy.bandPortal}</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">{title}</h1>
          <p className="mt-3 max-w-2xl text-slate-300">{description}</p>
        </header>
        <BandAccessForm role="band" title={bandCopy.login.editBandAdmin} description={bandCopy.login.bandAdminDescription} submitLabel={bandCopy.login.submitLabel} successMessage={bandCopy.login.bandAdminSuccess} />
      </div>
    </main>
  )
}

function AccessDenied({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{bandCopy.bandPortal}</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">{bandCopy.login.accountTitle}</h1>
          <p className="mt-3 max-w-2xl text-slate-300">{message}</p>
        </header>
      </div>
    </main>
  )
}

function AccountForm({
  username,
  bandName,
  bandProfile,
  tidalClientId,
  hasTidalClientSecret,
}: {
  username: string
  bandName: string
  bandProfile: {
    website_url: string | null
    facebook_url: string | null
    instagram_url: string | null
    tiktok_url: string | null
    paypal_url: string | null
    venmo_url: string | null
    cashapp_url: string | null
    custom_message: string | null
    logo_url?: string | null
  } | null
  tidalClientId: string | null
  hasTidalClientSecret: boolean
}) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{bandCopy.bandPortal}</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{bandCopy.login.accountTitle}</h1>
              <p className="mt-3 max-w-2xl text-slate-300">{bandCopy.login.accountDescription}</p>
            </div>
            <Link href="/band" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">{bandCopy.login.backToDashboard}</Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">{bandCopy.login.editBandAdmin}</h2>
          <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-2" action="/api/band/account" method="post">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="band-username">{bandCopy.accountPage.usernameLabel}</label>
              <input id="band-username" name="username" defaultValue={username} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="band-password">{bandCopy.accountPage.passwordLabel}</label>
              <input id="band-password" name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{bandCopy.accountPage.saveAccountButton}</button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">{bandCopy.login.editBandProfile}</h2>
          <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-2" action="/api/band/profile" method="post">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="band-name">{bandCopy.accountPage.bandNameLabel}</label>
              <input id="band-name" name="bandName" defaultValue={bandName} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            {[
              ['logoUrl', bandCopy.accountPage.logoUrlLabel, bandProfile?.logo_url ?? ''],
              ['websiteUrl', bandCopy.accountPage.websiteUrlLabel, bandProfile?.website_url ?? ''],
              ['facebookUrl', bandCopy.accountPage.facebookUrlLabel, bandProfile?.facebook_url ?? ''],
              ['instagramUrl', bandCopy.accountPage.instagramUrlLabel, bandProfile?.instagram_url ?? ''],
              ['tiktokUrl', bandCopy.accountPage.tiktokUrlLabel, bandProfile?.tiktok_url ?? ''],
              ['paypalUrl', bandCopy.accountPage.paypalUrlLabel, bandProfile?.paypal_url ?? ''],
              ['venmoUrl', bandCopy.accountPage.venmoUrlLabel, bandProfile?.venmo_url ?? ''],
              ['cashappUrl', bandCopy.accountPage.cashappUrlLabel, bandProfile?.cashapp_url ?? ''],
            ].map(([name, label, defaultValue]) => (
              <div key={name} className="space-y-2">
                <label htmlFor={name} className="text-sm font-medium text-slate-200">{label}</label>
                <input id={name} name={name} type="url" defaultValue={defaultValue ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
              </div>
            ))}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="customMessage">{bandCopy.accountPage.customMessageLabel}</label>
              <textarea id="customMessage" name="customMessage" defaultValue={bandProfile?.custom_message ?? ''} rows={3} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">{bandCopy.accountPage.tidalCredentialsLabel}</h3>
              <p className="text-xs text-slate-400">{bandCopy.accountPage.tidalCredentialsNote}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="tidalClientId">{bandCopy.accountPage.tidalClientIdLabel}</label>
              <input id="tidalClientId" name="tidalClientId" defaultValue={tidalClientId ?? ""} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="tidalClientSecret">{bandCopy.accountPage.tidalClientSecretLabel}</label>
              <input id="tidalClientSecret" name="tidalClientSecret" type="password" placeholder={hasTidalClientSecret ? '••••••••' : ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">{bandCopy.accountPage.saveBandProfileButton}</button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

export default async function BandAccountPage() {
  const testSession = await getTestSession()
  const supabase = await createClient()
  const serviceSupabase = createServiceClient()

  const liveAccess = await getLiveBandAccessContext(supabase, serviceSupabase, { requireAdmin: true })
  if (liveAccess) {
    const bandProfile = await getBandProfileForBandId(serviceSupabase, liveAccess.bandId)
    const { data: tidalSettings } = await serviceSupabase
      .from('band_profiles')
      .select('tidal_client_id, tidal_client_secret')
      .eq('band_id', liveAccess.bandId)
      .maybeSingle()

    return (
      <AccountForm
        username={liveAccess.username}
        bandName={liveAccess.bandName}
        bandProfile={bandProfile}
        tidalClientId={tidalSettings?.tidal_client_id ?? null}
        hasTidalClientSecret={Boolean(tidalSettings?.tidal_client_secret)}
      />
    )
  }

  if (testSession?.role === 'band') {
    const current = await getTestLogin(supabase, testSession.username)
    if (current?.band_access_level === 'admin') {
      const { data: tidalSettings } = await serviceSupabase
        .from('band_profiles')
        .select('tidal_client_id, tidal_client_secret')
        .eq('band_id', testSession.activeBandId)
        .maybeSingle()

      return <AccountForm username={current.username} bandName={current.band_name ?? bandCopy.accountPage.bandFallbackName} bandProfile={null} tidalClientId={tidalSettings?.tidal_client_id ?? null} hasTidalClientSecret={Boolean(tidalSettings?.tidal_client_secret)} />
    }
    return <AccessDenied message={bandCopy.login.accessDenied} />
  }

  return <LoginCard title={bandCopy.login.accountTitle} description={`${bandCopy.login.editBandAdmin} required.`} />
}
