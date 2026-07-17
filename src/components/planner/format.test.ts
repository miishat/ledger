import { describe, expect, it } from 'vitest'
import { formatMoney, formatMoneyCompact } from './format'

describe('formatMoneyCompact', () => {
  it('formats sub-thousand values as plain dollars', () => {
    expect(formatMoneyCompact(0)).toBe('$0')
    expect(formatMoneyCompact(950)).toBe('$950')
  })
  it('formats thousands with k', () => {
    expect(formatMoneyCompact(12_000)).toBe('$12k')
    expect(formatMoneyCompact(500_000)).toBe('$500k')
    expect(formatMoneyCompact(1_499)).toBe('$1k')
  })
  it('formats millions with one decimal under 10M, whole above', () => {
    expect(formatMoneyCompact(1_200_000)).toBe('$1.2M')
    expect(formatMoneyCompact(3_000_000)).toBe('$3M')
    expect(formatMoneyCompact(12_000_000)).toBe('$12M')
  })
  it('is negative-safe', () => {
    expect(formatMoneyCompact(-1_200_000)).toBe('-$1.2M')
    expect(formatMoneyCompact(-500)).toBe('-$500')
  })
})

describe('formatMoney (existing, unchanged)', () => {
  it('still formats full dollars', () => {
    expect(formatMoney(1234567)).toBe('$1,234,567')
  })
})
