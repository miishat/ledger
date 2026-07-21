import type { Holding } from '../../store/usePortfolioStore'
import {
  bookValue, convertAmount, holdingPlDollars, holdingPlPct, marketValue, portfolioTotals, toCad, type FxRates,
} from './portfolioMetrics'

const h = (over: Partial<Holding>): Holding => ({
  id: 'h1', ticker: 'AAA', quantity: 10, avgCost: 100, currency: 'CAD', account: 'A', ...over,
})

const rates: FxRates = { USD: 1.37, EUR: 1.47 }

const cadHolding: Holding = { id: 'h1', account: 'Default', ticker: 'VFV', quantity: 100, avgCost: 120, currency: 'CAD' }
const usdHolding: Holding = { id: 'h2', account: 'Default', ticker: 'AAPL', quantity: 10, avgCost: 180, currency: 'USD' }

describe('per-holding math', () => {
  it('book and market value', () => {
    expect(bookValue(cadHolding)).toBe(12_000)
    expect(marketValue(cadHolding, 150)).toBe(15_000)
  })

  it('P/L in dollars and percent', () => {
    expect(holdingPlDollars(cadHolding, 150)).toBe(3_000)
    expect(holdingPlPct(cadHolding, 150)).toBeCloseTo(25, 10)
    expect(holdingPlPct({ ...cadHolding, quantity: 0 }, 150)).toBeNull()
  })
})

describe('toCad', () => {
  it('leaves CAD untouched without needing a rate', () => {
    expect(toCad(100, 'CAD', {})).toBe(100)
  })

  it('applies the currency rate', () => {
    expect(toCad(100, 'USD', rates)).toBeCloseTo(137, 5)
    expect(toCad(100, 'EUR', rates)).toBeCloseTo(147, 5)
  })

  it('returns null when the rate is missing', () => {
    expect(toCad(100, 'GBP', rates)).toBeNull()
  })
})

describe('convertAmount', () => {
  it('is identity for the same currency', () => {
    expect(convertAmount(100, 'USD', 'USD', rates)).toBe(100)
  })

  it('crosses two currencies through CAD', () => {
    // 100 USD -> 137 CAD -> 137/1.47 EUR
    expect(convertAmount(100, 'USD', 'EUR', rates)).toBeCloseTo(137 / 1.47, 5)
  })

  it('returns null when either leg is missing', () => {
    expect(convertAmount(100, 'USD', 'GBP', rates)).toBeNull()
    expect(convertAmount(100, 'GBP', 'USD', rates)).toBeNull()
  })
})

describe('portfolioTotals', () => {
  it('normalizes everything to CAD', () => {
    const t = portfolioTotals(
      [
        { holding: cadHolding, price: 150 }, // invested 12,000 -> 15,000
        { holding: usdHolding, price: 200 }, // invested 1,800 USD -> 2,430 CAD; value 2,000 USD -> 2,700 CAD
      ],
      { USD: 1.35 },
    )
    expect(t.investedCad).toBeCloseTo(12_000 + 2_430, 6)
    expect(t.valueCad).toBeCloseTo(15_000 + 2_700, 6)
    expect(t.plCad).toBeCloseTo(3_270, 6)
    expect(t.plPct).toBeCloseTo((3_270 / 14_430) * 100, 6)
    expect(t.excludedCount).toBe(0)
  })

  it('handles the empty portfolio', () => {
    const t = portfolioTotals([], { USD: 1.35 })
    expect(t).toEqual({ investedCad: 0, valueCad: 0, plCad: 0, plPct: null, excludedCount: 0 })
  })

  it('sums three currencies into CAD', () => {
    const totals = portfolioTotals(
      [
        { holding: h({ id: '1', currency: 'CAD', quantity: 1, avgCost: 100 }), price: 120 },
        { holding: h({ id: '2', currency: 'USD', quantity: 1, avgCost: 100 }), price: 100 },
        { holding: h({ id: '3', currency: 'EUR', quantity: 1, avgCost: 100 }), price: 100 },
      ],
      rates,
    )
    expect(totals.investedCad).toBeCloseTo(100 + 137 + 147, 5)
    expect(totals.valueCad).toBeCloseTo(120 + 137 + 147, 5)
    expect(totals.excludedCount).toBe(0)
  })

  it('excludes holdings with no rate and counts them', () => {
    const totals = portfolioTotals(
      [
        { holding: h({ id: '1', currency: 'CAD', quantity: 1, avgCost: 100 }), price: 120 },
        { holding: h({ id: '2', currency: 'GBP', quantity: 1, avgCost: 100 }), price: 100 },
      ],
      rates,
    )
    expect(totals.investedCad).toBe(100)
    expect(totals.valueCad).toBe(120)
    expect(totals.excludedCount).toBe(1)
  })
})
