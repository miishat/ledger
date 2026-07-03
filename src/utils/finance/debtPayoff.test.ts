import { simulatePayoff, type Debt } from './debtPayoff'

const d = (id: string, balance: number, aprPct: number, minPayment: number): Debt => ({
  id, name: id, balance, aprPct, minPayment,
})

describe('simulatePayoff', () => {
  it('pays a single 0% debt in balance/min months with zero interest', () => {
    const r = simulatePayoff([d('a', 1_000, 0, 100)], 0, 'snowball')
    expect(r.months).toBe(10)
    expect(r.totalInterest).toBeCloseTo(0, 10)
    expect(r.payoffOrder).toEqual(['a'])
  })

  it('avalanche clears the high-APR debt first, snowball the small one', () => {
    const debts = [d('small-lowapr', 500, 1, 50), d('big-highapr', 5_000, 25, 100)]
    expect(simulatePayoff(debts, 200, 'avalanche').payoffOrder[0]).toBe('big-highapr')
    expect(simulatePayoff(debts, 200, 'snowball').payoffOrder[0]).toBe('small-lowapr')
  })

  it('avalanche never pays more total interest than snowball', () => {
    const debts = [d('a', 2_000, 5, 50), d('b', 3_000, 22, 75), d('c', 800, 12, 25)]
    const av = simulatePayoff(debts, 150, 'avalanche')
    const sn = simulatePayoff(debts, 150, 'snowball')
    expect(av.totalInterest).toBeLessThanOrEqual(sn.totalInterest)
  })

  it('series starts at the combined balance and ends at zero', () => {
    const r = simulatePayoff([d('a', 1_000, 0, 100)], 0, 'snowball')
    expect(r.series[0]).toEqual({ month: 0, total: 1_000 })
    expect(r.series[r.series.length - 1].total).toBe(0)
  })

  it('returns months: null when minimums cannot cover interest', () => {
    const r = simulatePayoff([d('a', 10_000, 60, 10)], 0, 'avalanche', 120)
    expect(r.months).toBeNull()
  })
})
