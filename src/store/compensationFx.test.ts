import { convertPackageToCad } from './compensationFx'
import type { CompensationPackage } from './useCompensationStore'

const basePkg: CompensationPackage = {
  id: 'primary',
  name: 'Current Offer',
  companyCurrentPrice: 100,
  baseSalary: 120000,
  pastSalaryChanges: [],
  cashBonusPercent: 10,
  cashBonusMonth: 12,
  esppContributionPercent: 5,
  esppDiscountPercent: 15,
  esppLockedInPrice: 80,
  rrspMatchPercent: 5,
  rrspMatchCap: 5000,
  rsuGrants: [
    {
      id: 'g1',
      grantName: 'Initial Grant',
      grantShares: 1000,
      grantPrice: 50,
      grantStartDate: '2026-01-01',
      vestingSchedule: { preset: '4yr-1yr-cliff', totalVestMonths: 48, cliffMonths: 12, frequency: 'monthly' },
    },
  ],
}

describe('convertPackageToCad', () => {
  it('returns the package unchanged when disabled', () => {
    const result = convertPackageToCad(basePkg, 1.35, false)
    expect(result).toBe(basePkg)
  })

  it('returns the package unchanged when fxRate is invalid', () => {
    expect(convertPackageToCad(basePkg, 0, true)).toBe(basePkg)
    expect(convertPackageToCad(basePkg, NaN, true)).toBe(basePkg)
    expect(convertPackageToCad(basePkg, -1, true)).toBe(basePkg)
  })

  it('converts companyCurrentPrice, esppLockedInPrice, and every RSU grantPrice by the fx rate when enabled', () => {
    const result = convertPackageToCad(basePkg, 1.35, true)
    expect(result.companyCurrentPrice).toBeCloseTo(135, 5)
    expect(result.esppLockedInPrice).toBeCloseTo(108, 5)
    expect(result.rsuGrants[0].grantPrice).toBeCloseTo(67.5, 5)
  })

  it('leaves non-price fields untouched', () => {
    const result = convertPackageToCad(basePkg, 1.35, true)
    expect(result.baseSalary).toBe(120000)
    expect(result.cashBonusPercent).toBe(10)
    expect(result.rsuGrants[0].grantShares).toBe(1000)
    expect(result.rsuGrants[0].grantName).toBe('Initial Grant')
    expect(result.rsuGrants[0].vestingSchedule).toEqual(basePkg.rsuGrants[0].vestingSchedule)
  })
})
