import { describe, expect, it } from 'vitest'
import { planRow, planFundSummary } from './planMetrics'
import type { Position } from '../../store/useAnalysisStore'

const pos = (over: Partial<Position>): Position => ({
  id: 'p', ticker: 'IFX', plannedAmount: 0, startPrice: 66.1, startPriceSource: 'manual',
  acted: false, lots: [], allocationPct: 35, extraPlanned: 0, ...over,
})

describe('planRow', () => {
  it('reproduces the sheet IFX row: 35% of 25k at 66.10 -> 77.58', () => {
    const r = planRow(pos({}), 25000, 77.58)
    expect(r.initialInvestment).toBeCloseTo(8750, 2)
    expect(r.shares).toBeCloseTo(132.38, 1)
    expect(r.currentValue).toBeCloseTo(10269.67, 0)
    expect(r.returnDollars).toBeCloseTo(1519.67, 0)
    expect(r.returnPct).toBeCloseTo(17.37, 1)
  })
  it('extra-only rows (0% allocation) still invest the extra', () => {
    const r = planRow(pos({ ticker: 'SEDG', allocationPct: 0, extraPlanned: 1000, startPrice: 55.23 }), 25000, 52.38)
    expect(r.initialInvestment).toBe(0)
    expect(r.currentValue).toBeCloseTo((1000 / 55.23) * 52.38, 2)
  })
})

describe('planFundSummary', () => {
  it('totals fund and computes return pct', () => {
    const rows = [planRow(pos({}), 25000, 77.58)]
    const s = planFundSummary(rows, 25000, 2000)
    expect(s.totalFund).toBe(27000)
    expect(s.currentValue).toBeCloseTo(rows[0].currentValue, 6)
  })
})
