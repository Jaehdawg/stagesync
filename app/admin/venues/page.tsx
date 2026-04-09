import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'
import { getAdminAccess } from '@/lib/admin-access'
import { buildVenueOperatorSections } from '@/lib/venue-ops'
import { getVenueProvisioningPlan } from '@/lib/venue-provisioning'
import { getVenueLeadStatusMessage } from '@/lib/venue-leads'
import { adminCopy } from '@/content/en/admin'

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminVenuesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams
  const leadNotice = typeof params?.leadNotice === 'string' ? params.leadNotice : undefined
  const leadMessage = getVenueLeadStatusMessage(leadNotice) ?? undefined
  const supabase = await createClient()
  const liveAdminAccess = await getAdminAccess(supabase)
  const sections = buildVenueOperatorSections()
  const provisioningPlan = getVenueProvisioningPlan()
  const [{ count: totalLeadCount }, { data: recentLeads }] = await Promise.all([
    supabase.from('venue_leads').select('id', { count: 'exact', head: true }),
    supabase
      .from('venue_leads')
      .select('id, company_name, contact_name, interest_level, follow_up_queue, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const venueLeads = recentLeads ?? []
  const recentNeedsReviewCount = venueLeads.filter((lead) => lead.status === 'new' || lead.status === 'reviewing').length
  const recentQualifiedCount = venueLeads.filter((lead) => lead.status === 'qualified').length
  const recentHotCount = venueLeads.filter((lead) => lead.follow_up_queue === 'venue-sales-hot').length
  const leadQueueSummary = [
    { label: 'Hot queue', value: venueLeads.filter((lead) => lead.follow_up_queue === 'venue-sales-hot').length },
    { label: 'Pricing queue', value: venueLeads.filter((lead) => lead.follow_up_queue === 'venue-sales-pricing').length },
    { label: 'Demo queue', value: venueLeads.filter((lead) => lead.follow_up_queue === 'venue-sales-demo').length },
    { label: 'Nurture queue', value: venueLeads.filter((lead) => lead.follow_up_queue === 'venue-sales-nurture').length },
  ]

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

        {leadMessage ? (
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">{leadMessage}</div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          {[
            { label: 'Venue leads captured', value: String(totalLeadCount ?? 0), detail: 'All venue inquiries saved so far' },
            { label: 'Recent needs review', value: String(recentNeedsReviewCount), detail: 'New or reviewing leads in the latest queue slice' },
            { label: 'Recent qualified', value: String(recentQualifiedCount), detail: 'Latest leads marked qualified' },
            { label: 'Recent hot leads', value: String(recentHotCount), detail: 'Latest leads routed to the hot sales queue' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
              <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-white">Recent venue leads</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">New inquiries land here for sales follow-up and qualification routing.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.2em] text-slate-300 sm:grid-cols-4">
              {leadQueueSummary.map((item) => (
                <span key={item.label} className="rounded-full border border-white/10 px-3 py-1 text-center">
                  {item.label}: {item.value}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {venueLeads.length ? (
              venueLeads.map((lead) => (
                <article key={lead.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{lead.company_name}</p>
                      <p className="text-sm text-slate-400">{lead.contact_name} · {lead.created_at}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                      <span className="rounded-full border border-white/10 px-3 py-1">{lead.interest_level}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1">{lead.status}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1">{lead.follow_up_queue}</span>
                    </div>
                  </div>
                  <form action={`/api/admin/venue-leads/${lead.id}`} method="post" className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
                    <label className="text-sm text-slate-300">
                      <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Status</span>
                      <select name="status" defaultValue={lead.status} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none">
                        <option value="new">new</option>
                        <option value="reviewing">reviewing</option>
                        <option value="contacted">contacted</option>
                        <option value="qualified">qualified</option>
                        <option value="closed">closed</option>
                      </select>
                    </label>
                    <label className="text-sm text-slate-300">
                      <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Queue</span>
                      <select name="followUpQueue" defaultValue={lead.follow_up_queue} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none">
                        <option value="venue-sales-hot">venue-sales-hot</option>
                        <option value="venue-sales-pricing">venue-sales-pricing</option>
                        <option value="venue-sales-demo">venue-sales-demo</option>
                        <option value="venue-sales-nurture">venue-sales-nurture</option>
                      </select>
                    </label>
                    <label className="text-sm text-slate-300">
                      <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Operator notes</span>
                      <input name="operatorNotes" defaultValue="" placeholder="Follow-up note or next step" className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" />
                    </label>
                    <button type="submit" className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">Save</button>
                  </form>
                  <form action={`/api/admin/venue-leads/${lead.id}`} method="post" className="mt-3 flex flex-wrap items-center gap-3">
                    <input type="hidden" name="action" value="create-draft" />
                    <button type="submit" className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/20">Create provisioning draft</button>
                    <p className="text-xs text-slate-400">Marks the lead as reviewing and seeds a provisioning note for the next handoff.</p>
                  </form>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">No venue leads yet.</p>
            )}
          </div>
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
