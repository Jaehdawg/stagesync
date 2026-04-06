import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { BandAccessForm } from '@/components/band-access-form'
import { getAdminAccess } from '@/lib/admin-access'
import { getStripeBillingConfig } from '@/lib/stripe-billing'
import { getStripeBillingReadiness } from '@/lib/stripe-billing-readiness'
import { adminCopy } from '@/content/en/admin'

function StatusChip({ ready }: { ready: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em] ${ready ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : 'border-amber-400/30 bg-amber-400/10 text-amber-100'}`}
    >
      {ready ? adminCopy.billingPage.readyLabel : adminCopy.billingPage.notReadyLabel}
    </span>
  )
}

export default async function AdminBillingPage() {
  const supabase = await createClient()
  const liveAdminAccess = await getAdminAccess(supabase)

  if (!liveAdminAccess) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.billingPage.title}</h1>
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

  const readiness = getStripeBillingReadiness(getStripeBillingConfig(), {
    checkoutUrl: process.env.STAGESYNC_BILLING_CHECKOUT_URL ?? null,
    portalUrl: process.env.STAGESYNC_BILLING_PORTAL_URL ?? null,
    invoicesUrl: process.env.STAGESYNC_BILLING_INVOICES_URL ?? null,
  })

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{adminCopy.platformControl}</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{adminCopy.billingPage.title}</h1>
              <p className="mt-3 max-w-2xl text-slate-300">{adminCopy.billingPage.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatusChip ready={readiness.stripeCheckoutReady && readiness.stripeWebhookReady} />
              <Link href="/admin" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:border-cyan-400/50">
                {adminCopy.backToAdmin}
              </Link>
            </div>
          </div>
          <form className="mt-4" action="/api/auth/logout" method="post">
            <button type="submit" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-cyan-400/50">
              {adminCopy.logoutLabel}
            </button>
          </form>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Stripe checkout</p>
            <p className="mt-3 text-lg font-semibold text-white">{readiness.stripeCheckoutReady ? 'Configured' : 'Missing config'}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Stripe webhook</p>
            <p className="mt-3 text-lg font-semibold text-white">{readiness.stripeWebhookReady ? 'Configured' : 'Missing config'}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Hosted URLs</p>
            <p className="mt-3 text-lg font-semibold text-white">{readiness.hostedCheckoutReady && readiness.hostedPortalReady && readiness.hostedInvoicesReady ? 'All present' : 'Partial'}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-white">{adminCopy.billingPage.missingKeysLabel}</h2>
              <StatusChip ready={readiness.missingStripeKeys.length === 0} />
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {readiness.missingStripeKeys.length > 0 ? readiness.missingStripeKeys.map((key) => <li key={key} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">{key}</li>) : <li className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-emerald-100">No missing Stripe keys.</li>}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-white">{adminCopy.billingPage.hostedUrlsLabel}</h2>
              <Link href="/api/billing/config" className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                {adminCopy.billingPage.endpointLabel}
              </Link>
            </div>
            <dl className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                <dt className="uppercase tracking-[0.22em] text-slate-400">Checkout</dt>
                <dd className="mt-1">{readiness.hostedCheckoutReady ? 'Configured' : 'Missing'}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                <dt className="uppercase tracking-[0.22em] text-slate-400">Portal</dt>
                <dd className="mt-1">{readiness.hostedPortalReady ? 'Configured' : 'Missing'}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                <dt className="uppercase tracking-[0.22em] text-slate-400">Invoices</dt>
                <dd className="mt-1">{readiness.hostedInvoicesReady ? 'Configured' : 'Missing'}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </main>
  )
}
