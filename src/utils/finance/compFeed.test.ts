import type { CompensationPackage } from '../../store/useCompensationStore'
import { compLumpSums } from './compFeed'

const basePkg: CompensationPackage = {
  id: 'p', name: 'Test', companyCurrentPrice: 100, baseSalary: 120_000,
  pastSalaryChanges: [], cashBonusPercent: 10, cashBonusMonth: 12,
  esppContributionPercent: 0, esppDiscountPercent: 15, esppLockedInPrice: 0,
  rrspMatchPercent: 0, rrspMatchCap: 0, rsuGrants: [],
}

const now = new Date('2026-07-02T00:00:00')

describe('compLumpSums', () => {
  it('places the annual bonus at the configured month, repeating yearly', () => {
    const lumps = compLumpSums(basePkg, 100, 24, now)
    const bonuses = lumps.filter((l) => l.label === 'Bonus')
    // Dec 2026 = month offset 5, Dec 2027 = 17
    expect(bonuses.map((b) => b.month)).toEqual([5, 17])
    expect(bonuses[0].amount).toBeCloseTo(12_000, 6)
  })

  it('maps RSU vest events with future dates into month offsets', () => {
    const pkg: CompensationPackage = {
      ...basePkg,
      cashBonusPercent: 0,
      rsuGrants: [{
        id: 'g1', grantName: 'G1', grantShares: 480, grantPrice: 50,
        grantStartDate: '2026-01-02',
        vestingSchedule: { preset: 'custom', totalVestMonths: 48, cliffMonths: 12, frequency: 'monthly' },
      }],
    }
    const lumps = compLumpSums(pkg, 100, 12, now)
    const rsu = lumps.filter((l) => l.label?.startsWith('RSU'))
    expect(rsu.length).toBeGreaterThan(0)
    expect(rsu.every((l) => l.month >= 1 && l.month <= 12)).toBe(true)
    expect(rsu.every((l) => l.amount > 0)).toBe(true)
  })

  it('drops zero-amount lumps and respects the horizon', () => {
    const lumps = compLumpSums({ ...basePkg, cashBonusPercent: 0 }, 100, 24, now)
    expect(lumps.filter((l) => l.amount === 0)).toHaveLength(0)
  })
})
