import { futureValue } from './compound'
import { mulberry32, probabilityOfSuccess, runMonteCarlo } from './monteCarlo'

describe('mulberry32', () => {
  it('is deterministic and in [0,1)', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const seq = [a(), a(), a()]
    expect(seq).toEqual([b(), b(), b()])
    expect(seq.every((x) => x >= 0 && x < 1)).toBe(true)
  })
})

describe('runMonteCarlo', () => {
  const base = { startBalance: 10_000, monthlySavings: 500, years: 10, meanReturnPct: 7, stdDevPct: 15 }

  it('is reproducible for a fixed seed', () => {
    const r1 = runMonteCarlo({ ...base, seed: 1, runs: 50 })
    const r2 = runMonteCarlo({ ...base, seed: 1, runs: 50 })
    expect(r1.bands).toEqual(r2.bands)
  })

  it('collapses to the deterministic path at zero volatility', () => {
    const r = runMonteCarlo({ ...base, stdDevPct: 0, runs: 10 })
    const last = r.bands[r.bands.length - 1]
    const expected = futureValue(10_000, 7, 120, 500)
    expect(last.p10).toBeCloseTo(last.p90, 6)
    expect(last.p50).toBeCloseTo(expected, 0)
  })

  it('orders percentiles', () => {
    const r = runMonteCarlo({ ...base, seed: 7, runs: 200 })
    for (const b of r.bands) {
      expect(b.p10).toBeLessThanOrEqual(b.p25)
      expect(b.p25).toBeLessThanOrEqual(b.p50)
      expect(b.p50).toBeLessThanOrEqual(b.p75)
      expect(b.p75).toBeLessThanOrEqual(b.p90)
    }
  })
})

describe('probabilityOfSuccess', () => {
  it('is the fraction of runs at/above target', () => {
    expect(probabilityOfSuccess([1, 2, 3, 4], 3)).toBe(0.5)
    expect(probabilityOfSuccess([], 1)).toBe(0)
  })
})
