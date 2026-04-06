import { buildCreditPurchaseEntry, type BillingCreditLedgerEntry } from './billing'

export type PerEventBillingConfig = {
  checkoutUrl?: string | null
  receiptsUrl?: string | null
}

export type PerEventBillingIntent = 'purchase' | 'receipts'

export function requiresPerEventPurchaseAcknowledgment(intent: PerEventBillingIntent) {
  return intent === 'purchase'
}

export type PerEventBillingRedirect = {
  url: string | null
  notice: string | null
}

export function resolvePerEventBillingRedirect(intent: PerEventBillingIntent, config: PerEventBillingConfig): PerEventBillingRedirect {
  switch (intent) {
    case 'purchase':
      return {
        url: config.checkoutUrl ?? null,
        notice: config.checkoutUrl ? null : 'credit-checkout-pending',
      }
    case 'receipts':
      return {
        url: config.receiptsUrl ?? null,
        notice: config.receiptsUrl ? null : 'receipt-pending',
      }
  }
}

export function getPerEventBillingStatusMessage(notice?: string | null) {
  switch (notice) {
    case 'terms-required':
      return 'Please confirm you agree to the Terms of Service before starting a per-event purchase.'
    case 'checkout-complete':
      return 'Per-event credit purchase completed. Refresh once if the remaining credit count looks stale.'
    case 'checkout-canceled':
      return 'Per-event credit purchase was canceled before payment completed.'
    case 'credit-checkout-pending':
      return 'Per-event credit checkout is not wired yet.'
    case 'receipt-pending':
      return 'Hosted receipts are not wired yet.'
    default:
      return null
  }
}

export function buildPerEventCreditPurchaseLedgerEntry(input: {
  bandId: string
  billingAccountId: string
  amount?: number
  provider?: string | null
  providerReference?: string | null
  note?: string | null
  createdAt?: Date
}): BillingCreditLedgerEntry {
  return buildCreditPurchaseEntry({
    bandId: input.bandId,
    billingAccountId: input.billingAccountId,
    amount: input.amount ?? 1,
    provider: input.provider ?? 'hosted',
    providerReference: input.providerReference ?? null,
    note: input.note ?? 'Per-event credit purchase',
    createdAt: input.createdAt,
  })
}
