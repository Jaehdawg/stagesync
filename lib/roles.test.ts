import { describe, expect, it } from 'vitest'
import { getRoleHomePath, normalizeRole } from './roles'

describe('roles helpers', () => {
  it('normalizes unknown roles to singer', () => {
    expect(normalizeRole(undefined)).toBe('singer')
    expect(normalizeRole('something')).toBe('singer')
  })

  it('maps roles to home paths', () => {
    expect(getRoleHomePath('singer')).toBe('/')
    expect(getRoleHomePath('band')).toBe('/band')
    expect(getRoleHomePath('admin')).toBe('/admin')
  })
})
