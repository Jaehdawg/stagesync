import { describe, expect, it } from 'vitest'
import {
  PROFESSIONAL_BILLING_CYCLE,
  PROFESSIONAL_FEATURE_HIGHLIGHTS,
  PROFESSIONAL_PRICE_LABEL,
  PROFESSIONAL_PRODUCT_NAME,
  getProfessionalProductLabel,
  listProfessionalFeatureHighlights,
} from './professional-plan'

describe('professional plan config', () => {
  it('exposes a stable product label and monthly price', () => {
    expect(PROFESSIONAL_PRODUCT_NAME).toBe('Professional')
    expect(PROFESSIONAL_PRICE_LABEL).toBe('$29/mo')
    expect(PROFESSIONAL_BILLING_CYCLE).toBe('monthly')
    expect(getProfessionalProductLabel()).toBe('Professional ($29/mo)')
  })

  it('lists the public feature highlights for the Professional plan', () => {
    expect(listProfessionalFeatureHighlights()).toEqual([...PROFESSIONAL_FEATURE_HIGHLIGHTS])
    expect(PROFESSIONAL_FEATURE_HIGHLIGHTS).toContain('Hosted checkout and billing portal')
  })
})
