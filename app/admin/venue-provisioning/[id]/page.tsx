import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'
import { getAdminAccess } from '@/lib/admin-access'
import { getVenueProvisioningMilestoneOptions } from '@/lib/venue-provisioning-trail'
import { adminCopy } from '@/content/en/admin'

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminVenueProvisioningPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<SearchParams> }) {
  const [{ id: leadId }, query] = await Promise.all([params, searchParams])
  const notice = typeof query?.notice === 'string' ? query.notice : undefined
  const supabase = await createClient()
  const liveAdminAccess = await getAdminAccess(supabase)

  if (!liveAdminAccess) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Venue provisioning</h1>
            <p className="mt-3 max-w-2xl text-slate-300">Admin login required to review venue draft handoffs.</p>
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

  const [{ data: draft }, { data: lead }, { data: trailEntries }] = await Promise.all([
    supabase
      .from('venue_provisioning_drafts')
      .select('id, venue_lead_id, company_name, contact_name, status, follow_up_queue, operator_notes, created_by, created_at, updated_at')
      .eq('venue_lead_id', leadId)
      .maybeSingle(),
    supabase
      .from('venue_leads')
      .select('id, company_name, contact_name, interest_level, follow_up_queue, status, operator_notes, created_at, updated_at')
      .eq('id', leadId)
      .maybeSingle(),
    supabase
      .from('venue_provisioning_events')
      .select('id, milestone, note, created_by, created_at')
      .eq('venue_lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const editableStatus = draft?.status ?? lead?.status ?? 'new'
  const editableQueue = draft?.follow_up_queue ?? lead?.follow_up_queue ?? 'venue-sales-hot'
  const editableNotes = draft?.operator_notes ?? lead?.operator_notes ?? ''
  const milestoneOptions = getVenueProvisioningMilestoneOptions()
  const recentTrail = trailEntries ?? []

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Venue provisioning detail</h1>
              <p className="mt-3 max-w-2xl text-slate-300">Review the lead handoff, draft state, and operator notes in one place.</p>
            </div>
            <Link href="/admin/venues" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">
              Back to venue ops
            </Link>
          </div>
        </header>

        {notice ? (
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">{notice === 'updated' ? 'Provisioning draft updated.' : notice}</div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold text-white">Current draft</h2>
            {draft ? (
              <dl className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex justify-between gap-4"><dt>Company</dt><dd className="font-medium text-white">{draft.company_name}</dd></div>
                <div className="flex justify-between gap-4"><dt>Contact</dt><dd className="font-medium text-white">{draft.contact_name}</dd></div>
                <div className="flex justify-between gap-4"><dt>Status</dt><dd className="font-medium text-white">{draft.status}</dd></div>
                <div className="flex justify-between gap-4"><dt>Queue</dt><dd className="font-medium text-white">{draft.follow_up_queue}</dd></div>
                <div className="flex justify-between gap-4"><dt>Created by</dt><dd className="font-medium text-white">{draft.created_by}</dd></div>
              </dl>
            ) : (
              <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">No provisioning draft exists yet for this lead.</p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold text-white">Lead snapshot</h2>
            {lead ? (
              <dl className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex justify-between gap-4"><dt>Company</dt><dd className="font-medium text-white">{lead.company_name}</dd></div>
                <div className="flex justify-between gap-4"><dt>Contact</dt><dd className="font-medium text-white">{lead.contact_name}</dd></div>
                <div className="flex justify-between gap-4"><dt>Interest</dt><dd className="font-medium text-white">{lead.interest_level}</dd></div>
                <div className="flex justify-between gap-4"><dt>Status</dt><dd className="font-medium text-white">{lead.status}</dd></div>
                <div className="flex justify-between gap-4"><dt>Queue</dt><dd className="font-medium text-white">{lead.follow_up_queue}</dd></div>
              </dl>
            ) : (
              <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">Lead record not found.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Provisioning notes</h2>
          <p className="mt-2 text-sm text-slate-300">These notes should capture setup, pricing, room scope, and the next handoff step.</p>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">{draft?.operator_notes ?? lead?.operator_notes ?? 'No notes yet.'}</pre>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white">Status trail</h2>
          <p className="mt-2 text-sm text-slate-300">Use milestones to log where the setup is now and what just happened.</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="text-lg font-semibold text-white">Milestone legend</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {milestoneOptions.map((option) => (
                  <li key={option.milestone} className="flex gap-2"><span className="text-cyan-300">•</span><span><span className="font-medium text-white">{option.label}</span> — {option.detail}</span></li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <h3 className="text-lg font-semibold text-white">Recent trail entries</h3>
              {recentTrail.length ? (
                <ol className="mt-3 space-y-3 text-sm text-slate-300">
                  {recentTrail.map((entry) => (
                    <li key={entry.id} className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-white">{entry.milestone}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{entry.created_by}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{entry.created_at}</p>
                      {entry.note ? <p className="mt-2">{entry.note}</p> : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">No status trail entries yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-white">Update handoff</h2>
              <p className="mt-2 text-sm text-slate-300">Keep the lead and provisioning draft in sync from this page.</p>
            </div>
            <form action={`/api/admin/venue-leads/${leadId}`} method="post">
              <input type="hidden" name="action" value="create-draft" />
              <button type="submit" className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/20">
                Sync draft from lead
              </button>
            </form>
          </div>

          <form action={`/api/admin/venue-leads/${leadId}`} method="post" className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 lg:grid-cols-[1fr_1fr_1fr_1.5fr_auto] lg:items-end">
            <label className="text-sm text-slate-300">
              <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Status</span>
              <select name="status" defaultValue={editableStatus} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none">
                <option value="new">new</option>
                <option value="reviewing">reviewing</option>
                <option value="contacted">contacted</option>
                <option value="qualified">qualified</option>
                <option value="closed">closed</option>
              </select>
            </label>
            <label className="text-sm text-slate-300">
              <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Queue</span>
              <select name="followUpQueue" defaultValue={editableQueue} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none">
                <option value="venue-sales-hot">venue-sales-hot</option>
                <option value="venue-sales-pricing">venue-sales-pricing</option>
                <option value="venue-sales-demo">venue-sales-demo</option>
                <option value="venue-sales-nurture">venue-sales-nurture</option>
              </select>
            </label>
            <label className="text-sm text-slate-300">
              <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Milestone</span>
              <select name="milestone" defaultValue="drafted" className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none">
                <option value="drafted">drafted</option>
                <option value="terms_reviewed">terms_reviewed</option>
                <option value="pricing_approved">pricing_approved</option>
                <option value="activated">activated</option>
              </select>
            </label>
            <label className="text-sm text-slate-300 lg:col-span-2">
              <span className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Operator notes</span>
              <textarea name="operatorNotes" defaultValue={editableNotes} rows={4} placeholder="Setup details, pricing notes, room scope, next handoff step" className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" />
            </label>
            <button type="submit" className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
              Save changes
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
