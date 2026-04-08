import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { BandAccessForm } from '@/components/band-access-form'
import { getTestSession } from '@/lib/test-session'
import { getTestLogin } from '@/lib/test-login-list'
import { getLiveBandAccessContext } from '@/lib/band-access'
import { getBandProfileForBandId } from '@/lib/band-tenancy'
import { resolveSubscriptionControlState } from '@/lib/subscription-sync'
import { getPerEventBillingStatusMessage } from '@/lib/per-event-billing'
import { bandCopy } from '@/content/en/band'

function getSubscriptionNoticeMessage(notice?: string | null) {
  switch (notice) {
    case 'checkout-complete':
      return 'Checkout completed. If the plan summary looks stale, refresh once.'
    case 'checkout-canceled':
      return 'Checkout was canceled before anything changed.'
    case 'terms-required':
      return 'Please confirm the Terms of Service before starting checkout.'
    case 'portal-return':
      return 'Returned from the billing portal.'
    case 'checkout-pending':
      return 'Hosted checkout is unavailable in this environment yet.'
    case 'portal-pending':
      return 'Hosted billing portal is unavailable in this environment yet.'
    case 'downgrade-pending':
      return 'Hosted downgrade flow is unavailable in this environment yet.'
    case 'no-change':
      return 'No billing change was made.'
    case 'invoices-pending':
      return 'Hosted invoices and receipts are unavailable in this environment yet.'
    case 'provider-pending':
      return 'Billing actions are waiting on the hosted provider configuration.'
    default:
      return null
  }
}

function getBillingStatusMessage(status: string) {
  switch (status) {
    case 'grace':
    case 'past_due':
      return 'Update your payment method in the hosted billing portal to keep Professional access active.'
    case 'suspended':
      return 'Your subscription is suspended at the provider. Use hosted billing to resolve the payment issue and restore access.'
    case 'canceled':
      return 'Your subscription is canceled at the provider. Start checkout again when you’re ready to re-subscribe.'
    case 'paused':
      return 'Your subscription is paused at the provider. Resume it from the hosted billing portal if available.'
    default:
      return 'Hosted billing keeps payment methods, receipts, and plan changes outside StageSync.'
  }
}

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
  currentPaidWindow,
  tidalClientId,
  hasTidalClientSecret,
  subscriptionControlState,
  subscriptionNotice,
  creditNotice,
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
  currentPaidWindow: {
    event_id: string
    started_at: string
    expires_at: string
    undo_grace_until: string | null
    restart_count: number | null
  } | null
  tidalClientId: string | null
  hasTidalClientSecret: boolean
  subscriptionControlState: {
    current: {
      plan: string
      status: string
      billingCycle: string
      label: string
      summary: string
    }
    billingCycleLabel: string
    primaryActionLabel: string
    primaryActionIntent: string
    secondaryActionLabel: string
    secondaryActionIntent: string
    helperText: string
    summaryLines: { label: string; value: string }[]
    freeShowsAllocated: number
    freeShowsRemaining: number
  }
  subscriptionNotice?: string | null
  creditNotice?: string | null
}) {
  const billingStatusMessage = getBillingStatusMessage(subscriptionControlState.current.status)
  const billingNeedsAttention = ['grace', 'past_due', 'suspended', 'paused', 'canceled'].includes(subscriptionControlState.current.status)
  const perEventNoticeMessage = getPerEventBillingStatusMessage(creditNotice)

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

        <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-cyan-50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">Billing summary</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{subscriptionControlState.current.label}</h2>
              <p className="mt-2 max-w-2xl text-cyan-50/90">{subscriptionControlState.current.summary}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-cyan-100/80">{subscriptionControlState.billingCycleLabel}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {subscriptionControlState.summaryLines.slice(0, 4).map((line) => (
                <div key={line.label} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/70">{line.label}</p>
                  <p className="mt-2 text-sm font-medium text-white">{line.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/support" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium text-white hover:border-cyan-400/50 hover:bg-white/10">Billing support</Link>
            <Link href="/terms" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium text-white hover:border-cyan-400/50 hover:bg-white/10">Terms</Link>
            <Link href="/privacy" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium text-white hover:border-cyan-400/50 hover:bg-white/10">Privacy</Link>
            <span className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 font-medium text-cyan-50/90">{subscriptionControlState.summaryLines[4]?.value ?? 'Billing status'}</span>
            <span className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 font-medium text-cyan-50/90">{subscriptionControlState.summaryLines[5]?.value ?? 'Free shows'}</span>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Subscription</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{subscriptionControlState.current.label}</h2>
              <p className="mt-2 max-w-2xl text-slate-300">{subscriptionControlState.current.summary}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">{subscriptionControlState.billingCycleLabel}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {subscriptionControlState.summaryLines.map((line) => (
                <div key={line.label} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{line.label}</p>
                  <p className="mt-2 text-sm font-medium text-white">{line.value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <form action="/api/billing/subscription" method="post" className="flex flex-col gap-3 rounded-2xl border border-cyan-400/20 bg-slate-950/40 px-4 py-3">
                <input type="hidden" name="intent" value={subscriptionControlState.primaryActionIntent} />
                <label className="flex items-start gap-3 text-sm text-slate-300">
                  <input type="checkbox" name="acknowledgeTerms" value="yes" required className="mt-1 h-4 w-4 rounded border-slate-400 bg-slate-950 text-cyan-400" />
                  <span>I agree to the <a href="/terms" className="text-cyan-300 underline-offset-4 hover:underline">Terms of Service</a> before starting subscription checkout.</span>
                </label>
                <button type="submit" className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-100">
                  {subscriptionControlState.primaryActionLabel}
                </button>
              </form>
              <form action="/api/billing/subscription" method="post">
                <input type="hidden" name="intent" value={subscriptionControlState.secondaryActionIntent} />
                <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white">
                  {subscriptionControlState.secondaryActionLabel}
                </button>
              </form>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">{subscriptionControlState.helperText}</p>
          {['grace', 'past_due', 'suspended', 'paused', 'canceled'].includes(subscriptionControlState.current.status) ? (
            <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              Hosted billing needs attention for this subscription status.
            </p>
          ) : null}
          {getSubscriptionNoticeMessage(subscriptionNotice) ? (
            <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {getSubscriptionNoticeMessage(subscriptionNotice)}
            </p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Per-event access</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">One-off show credit</h2>
              <p className="mt-2 max-w-2xl text-slate-300">Buy a credit for a single show. A paid show stays unlocked for 24 hours after start, and restarts inside that window do not burn another credit.</p>
              <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400">By starting checkout, you confirm you’ve read and agree to the Terms of Service and understand payment processing happens through the hosted provider.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <form action="/api/billing/credits" method="post" className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <input type="hidden" name="intent" value="purchase" />
                <label className="flex items-start gap-3 text-sm text-slate-300">
                  <input type="checkbox" name="acknowledgeTerms" value="yes" required className="mt-1 h-4 w-4 rounded border-slate-400 bg-slate-950 text-cyan-400" />
                  <span>I agree to the <a href="/terms" className="text-cyan-300 underline-offset-4 hover:underline">Terms of Service</a> before purchasing.</span>
                </label>
                <button type="submit" className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-100">Buy show credit</button>
              </form>
              <form action="/api/billing/credits" method="post">
                <input type="hidden" name="intent" value="receipts" />
                <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white">View receipts</button>
              </form>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              <p className="font-semibold text-white">Free shows remaining</p>
              <p className="mt-1">{subscriptionControlState.freeShowsRemaining} of {subscriptionControlState.freeShowsAllocated}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              <p className="font-semibold text-white">Paid window</p>
              <p className="mt-1">24 hours from the show start time.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              <p className="font-semibold text-white">Restart protection</p>
              <p className="mt-1">Repeated start/stop in one paid window should not consume another credit.</p>
            </div>
          </div>
          {perEventNoticeMessage ? (
            <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {perEventNoticeMessage}
            </p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Active access window</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Current paid show status</h2>
              <p className="mt-2 max-w-2xl text-slate-300">This shows the live 24-hour access window for the most recent paid show, including any undo grace period.</p>
            </div>
          </div>
          {currentPaidWindow ? (
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                <p className="font-semibold text-white">Show ID</p>
                <p className="mt-1 break-all">{currentPaidWindow.event_id}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                <p className="font-semibold text-white">Started</p>
                <p className="mt-1">{currentPaidWindow.started_at}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                <p className="font-semibold text-white">Expires</p>
                <p className="mt-1">{currentPaidWindow.expires_at}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                <p className="font-semibold text-white">Restarts</p>
                <p className="mt-1">{currentPaidWindow.restart_count ?? 0}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">No active paid show window is on file yet. Start a show to create one.</p>
          )}
          {currentPaidWindow?.undo_grace_until ? (
            <p className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              Undo grace is active until {currentPaidWindow.undo_grace_until}.
            </p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Billing portal</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Payment methods and invoices</h2>
              <p className="mt-2 max-w-2xl text-slate-300">{billingStatusMessage}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <form action="/api/billing/subscription" method="post">
                <input type="hidden" name="intent" value="manage" />
                <button type="submit" className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-100">Manage payment methods</button>
              </form>
              <form action="/api/billing/subscription" method="post">
                <input type="hidden" name="intent" value="invoices" />
                <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white">View invoices</button>
              </form>
              <form action="/api/billing/subscription" method="post">
                <input type="hidden" name="intent" value={subscriptionControlState.primaryActionIntent} />
                <button type="submit" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white">{subscriptionControlState.primaryActionLabel}</button>
              </form>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              <p className="font-semibold text-white">Payment methods</p>
              <p className="mt-1">Manage cards and billing details in the hosted portal.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              <p className="font-semibold text-white">Invoices and receipts</p>
              <p className="mt-1">Open hosted invoices and download receipts without leaving billing.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
              <p className="font-semibold text-white">Plan management</p>
              <p className="mt-1">Upgrade, downgrade, or return to the billing portal from the plan section.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            <div>
              <p className="font-semibold text-white">Need help with billing?</p>
              <p className="mt-1 text-cyan-100/90">If your plan looks wrong or a hosted action fails, the support page gives you the fastest fallback.</p>
            </div>
            <Link href="/support" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-medium text-white hover:border-cyan-400/50 hover:bg-white/10">
              Billing support
            </Link>
          </div>
          {billingNeedsAttention ? (
            <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {billingStatusMessage}
            </p>
          ) : null}
          {getSubscriptionNoticeMessage(subscriptionNotice) ? (
            <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {getSubscriptionNoticeMessage(subscriptionNotice)}
            </p>
          ) : null}
        </section>

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

type SearchParams = Record<string, string | string[] | undefined>

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function BandAccountPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams
  const subscriptionNotice = firstSearchParam(params?.subscriptionNotice) ?? null
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
    const { data: billingAccount } = await serviceSupabase
      .from('billing_accounts')
      .select('status, payment_provider, payment_subscription_id, free_shows_allocated, free_shows_used')
      .eq('band_id', liveAccess.bandId)
      .maybeSingle()
    const { data: currentPaidWindows } = await serviceSupabase
      .from('billing_show_windows')
      .select('event_id, started_at, expires_at, undo_grace_until, restart_count')
      .eq('band_id', liveAccess.bandId)
      .order('started_at', { ascending: false })
      .limit(1)

    return (
      <AccountForm
        username={liveAccess.username}
        bandName={liveAccess.bandName}
        bandProfile={bandProfile}
        currentPaidWindow={(currentPaidWindows ?? [])[0] ?? null}
        tidalClientId={tidalSettings?.tidal_client_id ?? null}
        hasTidalClientSecret={Boolean(tidalSettings?.tidal_client_secret)}
        subscriptionControlState={resolveSubscriptionControlState(billingAccount)}
        subscriptionNotice={subscriptionNotice}
        creditNotice={firstSearchParam(params?.creditNotice) ?? null}
      />
    )
  }

  if (testSession?.role === 'band') {
    const current = await getTestLogin(serviceSupabase, testSession.username)
    if (current?.band_access_level === 'admin') {
      const { data: tidalSettings } = await serviceSupabase
        .from('band_profiles')
        .select('tidal_client_id, tidal_client_secret')
        .eq('band_id', testSession.activeBandId)
        .maybeSingle()
      const { data: billingAccount } = await serviceSupabase
        .from('billing_accounts')
        .select('status, payment_provider, payment_subscription_id, free_shows_allocated, free_shows_used')
        .eq('band_id', testSession.activeBandId)
        .maybeSingle()
      const { data: currentPaidWindows } = await serviceSupabase
        .from('billing_show_windows')
        .select('event_id, started_at, expires_at, undo_grace_until, restart_count')
        .eq('band_id', testSession.activeBandId)
        .order('started_at', { ascending: false })
        .limit(1)

      return (
        <AccountForm
          username={current.username}
          bandName={current.band_name ?? bandCopy.accountPage.bandFallbackName}
          bandProfile={null}
          currentPaidWindow={(currentPaidWindows ?? [])[0] ?? null}
          tidalClientId={tidalSettings?.tidal_client_id ?? null}
          hasTidalClientSecret={Boolean(tidalSettings?.tidal_client_secret)}
          subscriptionControlState={resolveSubscriptionControlState(billingAccount)}
          subscriptionNotice={subscriptionNotice}
          creditNotice={firstSearchParam(params?.creditNotice) ?? null}
        />
      )
    }
    return <AccessDenied message={bandCopy.login.accessDenied} />
  }

  return <LoginCard title={bandCopy.login.accountTitle} description={`${bandCopy.login.editBandAdmin} required.`} />
}
