import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'
import { getAdminAccess } from '@/lib/admin-access'
import { buildVenueOperatorSections } from '@/lib/venue-ops'
import { getVenueProvisioningPlan } from '@/lib/venue-provisioning'
import { adminCopy } from '@/content/en/admin'

export default async function AdminVenuesPage() {
  const supabase = await createClient()
  const liveAdminAccess = await getAdminAccess(supabase)
  const sections = buildVenueOperatorSections()
  const provisioningPlan = getVenueProvisioningPlan()

  if (!liveAdminAccess) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.venuesPage.title}</h1>
            <p className="mt-3 max-w-2xl text-slate-300">{adminCopy.login.description}</p>
          </header>
          <BandAccessForm
            role="admin"
            title={adminCopy.login.title}
            description={adminCopy.login.description}
            submitLabel={adminCopy.login.submitLabel}
            successMessage={adminCopy.login.successMessage}
            endpoint="/api/auth/login"
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.venuesPage.title}</h1>
              <p className="mt-3 max-w-2xl text-slate-300">{adminCopy.venuesPage.description}</p>
            </div>
            <Link href="/admin" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">
              {adminCopy.backToAdmin}
            </Link>
          </div>
          <form className="mt-4" action="/api/auth/logout" method="post">
            <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">
              {adminCopy.logoutLabel}
            </button>
          </form>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {[
            { label: 'Venues onboarded', value: '0' },
            { label: 'Rooms configured', value: '0' },
            { label: 'Bands attached', value: '0' },
            { label: 'Needs review', value: '0' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">{adminCopy.venuesPage.provisioningTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">{adminCopy.venuesPage.provisioningDescription}</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="text-lg font-semibold text-white">Admin provisioning flow</h3>
              <ol className="mt-3 space-y-3 text-sm text-slate-300">
                {provisioningPlan.flow.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-xs text-cyan-200">{index + 1}</span>
                    <span><span className="font-medium text-white">{step.title}</span> — {step.detail}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="text-lg font-semibold text-white">Custom pricing and discounts</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {provisioningPlan.pricing.map((item) => (
                  <li key={item.title} className="flex gap-2"><span className="text-cyan-300">•</span><span><span className="font-medium text-white">{item.title}</span> — {item.detail}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="text-lg font-semibold text-white">Venue access / status lifecycle</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {provisioningPlan.lifecycle.map((state) => (
                  <span key={state.status} className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300" title={state.meaning}>
                    {state.status}
                  </span>
                ))}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {provisioningPlan.lifecycle.map((state) => (
                  <li key={state.status} className="flex gap-2"><span className="text-cyan-300">•</span><span><span className="font-medium text-white">{state.status}</span> — {state.meaning}</span></li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="text-lg font-semibold text-white">Configuration primitives</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {provisioningPlan.primitives.map((item) => (
                  <li key={item.title} className="flex gap-2"><span className="text-cyan-300">•</span><span><span className="font-medium text-white">{item.title}</span> — {item.detail}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {sections.map((section) => (
          <section key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">{section.description}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {section.items.map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
