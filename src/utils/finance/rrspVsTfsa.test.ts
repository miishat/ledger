import { compareRrspTfsa } from './rrspVsTfsa'

describe('compareRrspTfsa', () => {
  it('is a wash when marginal rates are equal', () => {
    const r = compareRrspTfsa(10_000, 30, 30, 6, 25)
    expect(r.rrspNet).toBeCloseTo(r.tfsaNet, 6)
    expect(r.recommendation).toBe('Either')
  })

  it('favours RRSP when the retirement rate is lower', () => {
    const r = compareRrspTfsa(10_000, 40, 25, 6, 25)
    expect(r.rrspNet).toBeGreaterThan(r.tfsaNet)
    expect(r.recommendation).toBe('RRSP')
  })

  it('favours TFSA when the retirement rate is higher', () => {
    const r = compareRrspTfsa(10_000, 25, 40, 6, 25)
    expect(r.recommendation).toBe('TFSA')
  })
})
