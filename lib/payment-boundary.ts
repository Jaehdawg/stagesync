export const PAYMENT_PROVIDER_NAME = 'Stripe' as const
export const PAYMENT_PROVIDER_HOSTED_COMPONENTS = ['Checkout', 'Billing Portal', 'Invoices'] as const

export type PaymentBoundaryRule = {
  title: string
  detail: string
}

export function getPaymentBoundaryRules(): PaymentBoundaryRule[] {
  return [
    {
      title: 'Hosted payments only',
      detail: 'Checkout, billing portal, and invoice access stay in the provider-hosted flow instead of custom card forms inside StageSync.',
    },
    {
      title: 'No raw card storage',
      detail: 'StageSync must never store card numbers, CVC data, or other payment instrument secrets.',
    },
    {
      title: 'Webhook verification required',
      detail: 'Stripe webhook events are only trusted after signature verification with the configured webhook secret.',
    },
    {
      title: 'Provider metadata only',
      detail: 'StageSync may store provider IDs, statuses, and billing references, but not payment credentials.',
    },
  ]
}

export function getPaymentBoundarySummary() {
  return `StageSync keeps payment data outside its PCI boundary by using ${PAYMENT_PROVIDER_NAME} hosted flows for ${PAYMENT_PROVIDER_HOSTED_COMPONENTS.join(', ')}.`
}
