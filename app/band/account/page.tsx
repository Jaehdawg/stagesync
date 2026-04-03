import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { BandAccessForm } from '@/components/band-access-form'
import { getTestSession } from '@/lib/test-session'
import { getTestLogin } from '@/lib/test-login-list'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { getBandProfileForBandId } from '@/lib/band-tenancy'

function LoginCard({ title, description }: { title: string; description: string }) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">{title}</h1>
          <p className="mt-3 max-w-2xl text-slate-300">{description}</p>
        </header>
        <BandAccessForm role="band" title="Edit Band Admin" description="Use your band username and password to access show controls." submitLabel="Sign in" successMessage="Band admin updated successfully." />
      </div>
    </main>
  )
}

function AccessDenied({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">Band account</h1>
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
}) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Band portal</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Band account</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Edit your band profile and login credentials.</p>
            </div>
            <Link href="/band" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">Back to band dashboard</Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Edit Band Admin</h2>
          <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-2" action="/api/band/account" method="post">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="band-username">Username</label>
              <input id="band-username" name="username" defaultValue={username} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="band-password">Password</label>
              <input id="band-password" name="password" type="password" className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Save account</button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Band profile</h2>
          <form className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-2" action="/api/band/profile" method="post">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="band-name">Band name</label>
              <input id="band-name" name="bandName" defaultValue={bandName} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            {[
              ['logoUrl', 'Logo URL', bandProfile?.logo_url ?? ''],
              ['websiteUrl', 'Website', bandProfile?.website_url ?? ''],
              ['facebookUrl', 'Facebook', bandProfile?.facebook_url ?? ''],
              ['instagramUrl', 'Instagram', bandProfile?.instagram_url ?? ''],
              ['tiktokUrl', 'TikTok', bandProfile?.tiktok_url ?? ''],
              ['paypalUrl', 'PayPal', bandProfile?.paypal_url ?? ''],
              ['venmoUrl', 'Venmo', bandProfile?.venmo_url ?? ''],
              ['cashappUrl', 'CashApp', bandProfile?.cashapp_url ?? ''],
            ].map(([name, label, defaultValue]) => (
              <div key={name} className="space-y-2">
                <label htmlFor={name} className="text-sm font-medium text-slate-200">{label}</label>
                <input id={name} name={name} type="url" defaultValue={defaultValue ?? ''} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
              </div>
            ))}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="customMessage">Custom message</label>
              <textarea id="customMessage" name="customMessage" defaultValue={bandProfile?.custom_message ?? ''} rows={3} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white">Save band profile</button>
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
    return (
      <AccountForm
        username={liveAccess.username}
        bandName={liveAccess.bandName}
        bandProfile={bandProfile}
      />
    )
  }

  if (testSession?.role === 'band') {
    const current = await getTestLogin(supabase, testSession.username)
    if (current?.band_access_level === 'admin') {
      return <AccountForm username={current.username} bandName={current.band_name ?? 'Band'} bandProfile={null} />
    }
    return <AccessDenied message="Band admin access required." />
  }

  return <LoginCard title="Band account" description="Edit Band Admin required." />
}
