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
    // AMENDED (P4c Task 2 fix): the original fixture
    // [small-lowapr 500 @ 1% min 50, big-highapr 5000 @ 25% min 100, extra 200]
    // only passed under the buggy single-pass code that starved the small
    // debt of its minimum. Under the brief's 3-pass algorithm the small debt
    // amortizes to zero in ~10 months on its own $50 minimum no matter where
    // the extra goes, so it always clears first — the assertion was
    // mathematically unsatisfiable. This fixture uses comparable balances so
    // the strategy genuinely decides the payoff order.
    const debts = () => [
      d('low-balance-lowapr', 2_800, 3, 60),
      d('high-balance-highapr', 3_000, 24, 70),
    ]
    const av = simulatePayoff(debts(), 250, 'avalanche')
    const sn = simulatePayoff(debts(), 250, 'snowball')
    // Strategies pick opposite focus debts and produce opposite payoff orders.
    expect(av.payoffOrder[0]).toBe('high-balance-highapr')
    expect(sn.payoffOrder[0]).toBe('low-balance-lowapr')
    // The true avalanche invariant: strictly less total interest here.
    expect(av.totalInterest).toBeLessThan(sn.totalInterest)
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

  it('guarantees every live debt its minimum payment before extra flows to the focus debt', () => {
    // Reviewer counterexample: FOCUS has a small balance but a high APR, so
    // avalanche makes it the focus debt. OTHER is much larger with a lower
    // APR. With extraMonthly 0, budget === totalMin (100) exactly, so pass 3
    // (extra to focus debt) never has anything to distribute — each debt
    // must simply amortize at its own minimum. The old (buggy) single-pass
    // implementation instead poured the whole $100 budget into FOCUS first,
    // leaving OTHER's minimum unpaid in month 1 (balance would grow to
    // 2008.33 instead of shrinking to 1928.33).
    //
    // Hand-computed month-by-month (interest accrues, then min payment):
    //   Month 1:
    //     FOCUS: 500 + 500*0.30/12 = 512.5;      512.5 - 20 = 492.5
    //     OTHER: 2000 + 2000*0.05/12 = 2008.3333...; 2008.3333... - 80 = 1928.3333...
    //   Month 2:
    //     FOCUS: 492.5 + 492.5*0.30/12 = 504.8125;  504.8125 - 20 = 484.8125
    //     OTHER: 1928.3333... + 1928.3333...*0.05/12 = 1936.368056...; -80 = 1856.368056...
    const debts = [d('FOCUS', 500, 30, 20), d('OTHER', 2_000, 5, 80)]
    const r = simulatePayoff(debts, 0, 'avalanche')

    // OTHER must have received its $80 minimum in month 1 (balance shrinks,
    // it does not merely accrue interest untouched as the bug produced).
    expect(r.series[1].total).toBeCloseTo(492.5 + 1928.3333333333333, 6)

    // Full-run invariants, hand/script-verified against the brief's algorithm.
    expect(r.months).toBe(29)
    expect(r.totalInterest).toBeCloseTo(378.32876072075976, 6)
    expect(r.payoffOrder).toEqual(['OTHER', 'FOCUS'])
  })
})
