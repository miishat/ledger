import { describe, expect, it } from 'vitest'
import { planRow, planFundSummary } from './planMetrics'
import type { Position } from '../../store/useAnalysisStore'

const pos = (over: Partial<Position>): Position => ({
  id: 'p1', ticker: 'AAPL', plannedAmount: 0, startPrice: 100,
  startPriceSource: 'manual', acted: false, lots: [], ...over,
})

describe('planRow with plannedBudget', () => {
  it('computes planned dollars from budget x allocation', () => {
    const r = planRow(pos({ allocationPct: 25 }), 10000, 120)
    expect(r.plannedDollars).toBe(2500)
    expect(r.shares).toBeCloseTo(25) // 2500 / 100
    expect(r.currentValue).toBeCloseTo(3000)
    expect(r.returnDollars).toBeCloseTo(500)
  })
})

describe('planFundSummary', () => {
  it('uses plannedBudget as the fund basis', () => {
    const rows = [planRow(pos({ allocationPct: 100 }), 10000, 110)]
    const s = planFundSummary(rows, 10000)
    expect(s.totalFund).toBe(10000)
    expect(s.currentValue).toBeCloseTo(11000)
    expect(s.totalReturnPct).toBeCloseTo(10)
  })
})
