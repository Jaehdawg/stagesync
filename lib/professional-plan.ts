export const PROFESSIONAL_PRODUCT_NAME = 'Professional' as const
export const PROFESSIONAL_PRICE_LABEL = '$29/mo' as const
export const PROFESSIONAL_BILLING_CYCLE = 'monthly' as const

export const PROFESSIONAL_FEATURE_HIGHLIGHTS = [
  'Hosted checkout and billing portal',
  'Monthly recurring billing only',
  'Provider-synced subscription status',
] as const

export function getProfessionalProductLabel() {
  return `${PROFESSIONAL_PRODUCT_NAME} (${PROFESSIONAL_PRICE_LABEL})`
}

export function listProfessionalFeatureHighlights() {
  return [...PROFESSIONAL_FEATURE_HIGHLIGHTS]
}
