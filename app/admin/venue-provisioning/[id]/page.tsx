import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'
import { getAdminAccess } from '@/lib/admin-access'
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

  const [{ data: draft }, { data: lead }] = await Promise.all([
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
  ])

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
      </div>
    </main>
  )
}
