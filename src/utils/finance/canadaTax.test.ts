import {
  cppContribution,
  effectiveRate,
  eiPremium,
  federalTax,
  marginalRate,
  marginalRateBreakdown,
  provincialTax,
  provincialTaxParts,
  takeHomePay,
  takeHomeWithDeductions,
  totalIncomeTax,
} from './canadaTax'

describe('federalTax', () => {
  it('is zero at or below the BPA', () => {
    expect(federalTax(16452, 'ON')).toBe(0)
    expect(federalTax(10000, 'ON')).toBe(0)
  })

  it('taxes $100k in ON correctly', () => {
    // 58,523×0.14 + (100,000−58,523)×0.205 = 8,193.22 + 8,502.79 = 16,696.01
    // minus BPA credit 16,452×0.14 = 2,303.28 → 14,392.73
    expect(federalTax(100_000, 'ON')).toBeCloseTo(14_392.73, 0)
  })

  it('applies the 16.5% Quebec abatement', () => {
    expect(federalTax(100_000, 'QC')).toBeCloseTo(14_392.73 * 0.835, 0)
  })
})

describe('provincialTax', () => {
  it('taxes $100k in ON correctly including surtax', () => {
    // 53,891×0.0505 + (100,000−53,891)×0.0915 = 2,721.50 + 4,218.97 = 6,940.47
    // minus BPA credit 12,989×0.0505 = 655.94 → 6,284.52
    // surtax: (6,284.52 − 5,818)×0.20 = 93.30 → total 6,377.83
    expect(provincialTax(100_000, 'ON')).toBeCloseTo(6_377.83, 0)
  })

  it('taxes $100k in AB correctly', () => {
    // 61,200×0.08 + (100,000−61,200)×0.10 = 4,896 + 3,880 = 8,776
    // minus BPA credit 22,769×0.08 = 1,821.52 → 6,954.48
    expect(provincialTax(100_000, 'AB')).toBeCloseTo(6_954.48, 0)
  })

  it('never returns negative tax', () => {
    expect(provincialTax(5_000, 'NL')).toBe(0)
  })
})

describe('CPP and EI (2026)', () => {
  it('caps CPP base + CPP2 at the 2026 maxima', () => {
    // (74,600−3,500)×0.0595 = 4,230.45; CPP2 (85,000−74,600)×0.04 = 416
    expect(cppContribution(120_000)).toBeCloseTo(4_646.45, 2)
  })

  it('computes partial CPP below YMPE and zero below the exemption', () => {
    expect(cppContribution(53_500)).toBeCloseTo((53_500 - 3_500) * 0.0595, 2)
    expect(cppContribution(3_000)).toBe(0)
  })

  it('caps EI at the 2026 maximum, with the Quebec rate', () => {
    expect(eiPremium(80_000, 'ON')).toBeCloseTo(68_900 * 0.0163, 2) // 1,123.07
    expect(eiPremium(80_000, 'QC')).toBeCloseTo(68_900 * 0.013, 2) // 895.70
  })
})

describe('rates and take-home', () => {
  it('marginal rate at $100k ON is fed 20.5 + ON 9.15×1.20 surtax = 31.48', () => {
    expect(marginalRate(100_000, 'ON')).toBeCloseTo(31.48, 1)
  })

  it('effective rate is total tax over income', () => {
    expect(effectiveRate(100_000, 'ON')).toBeCloseTo(((14_392.73 + 6_377.83) / 100_000) * 100, 1)
  })

  it('take-home for $100k ON nets all components', () => {
    const t = takeHomePay(100_000, 'ON')
    expect(t.federal).toBeCloseTo(14_392.73, 0)
    expect(t.provincial).toBeCloseTo(6_377.83, 0)
    expect(t.cpp).toBeCloseTo(4_646.45, 2)
    expect(t.ei).toBeCloseTo(1_123.07, 2)
    expect(t.net).toBeCloseTo(100_000 - 14_392.73 - 6_377.83 - 4_646.45 - 1_123.07, 0)
  })
})

describe('marginalRateBreakdown', () => {
  it('components sum to the headline marginal rate (ON, $200k)', () => {
    const b = marginalRateBreakdown(200_000, 'ON')
    expect(b.total).toBeCloseTo(marginalRate(200_000, 'ON'), 6)
    expect(b.federal + b.provincialBase + b.surtax).toBeCloseTo(b.total, 10)
  })

  it('shows a positive surtax component once ON tax exceeds both thresholds ($200k)', () => {
    const b = marginalRateBreakdown(200_000, 'ON')
    // marginal surtax = 56% of the 12.16% ON bracket rate ≈ 6.81
    expect(b.surtax).toBeGreaterThan(6)
    expect(b.surtax).toBeLessThan(7.5)
  })

  it('has no surtax component at low ON income ($60k)', () => {
    expect(marginalRateBreakdown(60_000, 'ON').surtax).toBe(0)
  })

  it('has no surtax component outside Ontario (BC, $200k)', () => {
    expect(marginalRateBreakdown(200_000, 'BC').surtax).toBe(0)
  })

  it('provincialTaxParts sums to provincialTax', () => {
    for (const income of [40_000, 90_000, 150_000, 250_000]) {
      const parts = provincialTaxParts(income, 'ON')
      expect(parts.base + parts.surtax).toBeCloseTo(provincialTax(income, 'ON'), 8)
    }
  })
})

describe('takeHomeWithDeductions', () => {
  it('zero contributions matches takeHomePay', () => {
    const base = takeHomePay(100000, 'ON')
    const d = takeHomeWithDeductions(100000, 'ON', 0, 0)
    expect(d.net).toBeCloseTo(base.net, 6)
    expect(d.taxSavings).toBe(0)
    expect(d.taxableIncome).toBe(100000)
  })

  it('contributions reduce taxable income and produce positive savings', () => {
    const d = takeHomeWithDeductions(100000, 'ON', 10000, 8000)
    expect(d.taxableIncome).toBe(82000)
    expect(d.taxSavings).toBeGreaterThan(0)
    expect(d.taxSavings).toBeCloseTo(
      totalIncomeTax(100000, 'ON') - totalIncomeTax(82000, 'ON'), 6)
  })

  it('CPP and EI are unaffected by deductions', () => {
    const base = takeHomePay(100000, 'ON')
    const d = takeHomeWithDeductions(100000, 'ON', 20000, 0)
    expect(d.cpp).toBeCloseTo(base.cpp, 6)
    expect(d.ei).toBeCloseTo(base.ei, 6)
  })

  it('contributions above gross clamp taxable income at zero', () => {
    const d = takeHomeWithDeductions(30000, 'ON', 40000, 8000)
    expect(d.taxableIncome).toBe(0)
  })
})
