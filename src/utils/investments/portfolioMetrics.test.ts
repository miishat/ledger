import type { Holding } from '../../store/usePortfolioStore'
import {
  bookValue, holdingPlDollars, holdingPlPct, marketValue, portfolioTotals, toCad,
} from './portfolioMetrics'

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

  it('converts USD to CAD only', () => {
    expect(toCad(100, 'USD', 1.35)).toBeCloseTo(135, 10)
    expect(toCad(100, 'CAD', 1.35)).toBe(100)
  })
})

describe('portfolioTotals', () => {
  it('normalizes everything to CAD', () => {
    const t = portfolioTotals(
      [
        { holding: cadHolding, price: 150 }, // invested 12,000 → 15,000
        { holding: usdHolding, price: 200 }, // invested 1,800 USD → 2,430 CAD; value 2,000 USD → 2,700 CAD
      ],
      1.35,
    )
    expect(t.investedCad).toBeCloseTo(12_000 + 2_430, 6)
    expect(t.valueCad).toBeCloseTo(15_000 + 2_700, 6)
    expect(t.plCad).toBeCloseTo(3_270, 6)
    expect(t.plPct).toBeCloseTo((3_270 / 14_430) * 100, 6)
  })

  it('handles the empty portfolio', () => {
    const t = portfolioTotals([], 1.35)
    expect(t).toEqual({ investedCad: 0, valueCad: 0, plCad: 0, plPct: null })
  })
})
