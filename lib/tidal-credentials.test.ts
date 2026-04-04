import { afterEach, describe, expect, it } from 'vitest'
import { decryptTidalCredential, encryptTidalCredential } from './tidal-credentials'

afterEach(() => {
  delete process.env.TIDAL_CREDENTIALS_ENCRYPTION_KEY
  delete process.env.SUPABASE_SECRET_KEY
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
})

describe('tidal credential encryption', () => {
  it('round-trips encrypted credentials with the configured key', () => {
    process.env.TIDAL_CREDENTIALS_ENCRYPTION_KEY = 'unit-test-key'

    const encrypted = encryptTidalCredential('shhh-secret')

    expect(encrypted).toMatch(/^enc:v1:/)
    expect(decryptTidalCredential(encrypted)).toBe('shhh-secret')
  })

  it('passes legacy plaintext values through unchanged', () => {
    process.env.TIDAL_CREDENTIALS_ENCRYPTION_KEY = 'unit-test-key'

    expect(decryptTidalCredential('plain-secret')).toBe('plain-secret')
  })
})
