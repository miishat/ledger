import { describe, expect, it } from 'vitest'
import { applyLumpTax, resolveCompTaxRate } from './compTax'
import { marginalRate } from './canadaTax'

describe('applyLumpTax', () => {
  const lumps = [
    { month: 3, amount: 10000, label: 'RSU X' },
    { month: 12, amount: 5000, label: 'Bonus' },
  ]
  it('applies the haircut and preserves labels/months', () => {
    const taxed = applyLumpTax(lumps, 0.5)
    expect(taxed).toEqual([
      { month: 3, amount: 5000, label: 'RSU X' },
      { month: 12, amount: 2500, label: 'Bonus' },
    ])
  })
  it('returns lumps unchanged for rate <= 0', () => {
    expect(applyLumpTax(lumps, 0)).toEqual(lumps)
    expect(applyLumpTax(lumps, -1)).toEqual(lumps)
  })
  it('clamps rate above 1', () => {
    expect(applyLumpTax(lumps, 1.5)[0].amount).toBe(0)
  })
})

describe('resolveCompTaxRate', () => {
  it('returns 0 when disabled', () => {
    expect(resolveCompTaxRate({ enabled: false, auto: true, manualPct: 50, income: 100000, province: 'ON' })).toBe(0)
  })
  it('uses marginal rate when auto', () => {
    const expected = marginalRate(100000, 'ON') / 100
    expect(resolveCompTaxRate({ enabled: true, auto: true, manualPct: 50, income: 100000, province: 'ON' })).toBeCloseTo(expected, 10)
  })
  it('uses clamped manual percent otherwise', () => {
    expect(resolveCompTaxRate({ enabled: true, auto: false, manualPct: 50, income: 0, province: 'ON' })).toBe(0.5)
    expect(resolveCompTaxRate({ enabled: true, auto: false, manualPct: 150, income: 0, province: 'ON' })).toBe(1)
    expect(resolveCompTaxRate({ enabled: true, auto: false, manualPct: -10, income: 0, province: 'ON' })).toBe(0)
  })
})
