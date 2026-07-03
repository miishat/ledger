import { buildForecast } from './forecast'

const base = {
  startBalance: 10_000,
  monthlySavings: 1_000,
  annualReturnPct: 0,
  annualInflationPct: 0,
  contributionStepUpPct: 0,
  years: 2,
}

describe('buildForecast', () => {
  it('zero-rate accumulation is hand-computable', () => {
    const f = buildForecast(base)
    expect(f).toHaveLength(25)
    expect(f[0].base).toBe(10_000)
    expect(f[24].base).toBe(10_000 + 24 * 1_000)
    expect(f[24].growth).toBeCloseTo(0, 10)
  })

  it('lump sums land in their month', () => {
    const f = buildForecast({ ...base, lumpSums: [{ month: 3, amount: 5_000 }] })
    expect(f[2].base).toBe(12_000)
    expect(f[3].base).toBe(18_000) // 13,000 + 5,000
    expect(f[3].contributed).toBe(18_000)
  })

  it('step-up raises contributions after each 12 months', () => {
    const f = buildForecast({ ...base, contributionStepUpPct: 10 })
    // months 1-12: 1,000/mo; months 13+: 1,100/mo
    expect(f[12].base).toBe(22_000)
    expect(f[13].base).toBe(23_100)
  })

  it('real values deflate by inflation', () => {
    const f = buildForecast({ ...base, annualInflationPct: 100 }) // halves each year
    expect(f[12].real).toBeCloseTo(f[12].base / 2, 6)
    expect(f[24].real).toBeCloseTo(f[24].base / 4, 6)
  })

  it('scenario bands straddle base', () => {
    const f = buildForecast({ ...base, annualReturnPct: 7, scenarioSpreadPct: 2 })
    const last = f[24]
    expect(last.conservative).toBeLessThan(last.base)
    expect(last.optimistic).toBeGreaterThan(last.base)
  })

  it('monthlyDrag reduces contributions until its month, then stops', () => {
    const f = buildForecast({ ...base, monthlyDrag: { amount: 400, untilMonth: 12 } })
    expect(f[12].base).toBe(10_000 + 12 * 600)
    expect(f[24].base).toBe(10_000 + 12 * 600 + 12 * 1_000)
  })
})
