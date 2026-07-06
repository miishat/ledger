import type { Position } from '../../store/useAnalysisStore'
import { currentValue, totalInvested } from './analysisMetrics'

export interface PlanRow {
  positionId: string
  ticker: string
  allocationPct: number
  plannedDollars: number
  startPrice: number
  shares: number
  currentPrice: number
  currentValue: number
  returnDollars: number
  returnPct: number | null
}

export function planRow(position: Position, plannedBudget: number, currentPrice: number): PlanRow {
  const allocationPct = position.allocationPct ?? 0
  const plannedDollars = (plannedBudget * allocationPct) / 100
  const shares = position.startPrice > 0 ? plannedDollars / position.startPrice : 0
  const value = shares * currentPrice
  const returnDollars = value - plannedDollars
  return {
    positionId: position.id,
    ticker: position.ticker,
    allocationPct,
    plannedDollars,
    startPrice: position.startPrice,
    shares,
    currentPrice,
    currentValue: value,
    returnDollars,
    returnPct: plannedDollars > 0 ? (returnDollars / plannedDollars) * 100 : null,
  }
}

export interface FundSummary {
  initialFund: number
  extraFund: number
  totalFund: number
  currentValue: number
  totalReturnPct: number | null
}

export function planFundSummary(rows: PlanRow[], plannedBudget: number): FundSummary {
  const value = rows.reduce((s, r) => s + r.currentValue, 0)
  return {
    initialFund: plannedBudget,
    extraFund: 0,
    totalFund: plannedBudget,
    currentValue: value,
    totalReturnPct: plannedBudget > 0 ? ((value - plannedBudget) / plannedBudget) * 100 : null,
  }
}

export function actualFundSummary(positions: Position[], priceFor: (p: Position) => number): FundSummary {
  const invested = positions.reduce((s, p) => s + totalInvested(p.lots), 0)
  const value = positions.reduce((s, p) => s + currentValue(p.lots, priceFor(p)), 0)
  // Actual side has no plan split; initialFund carries total invested, extraFund 0.
  return {
    initialFund: invested,
    extraFund: 0,
    totalFund: invested,
    currentValue: value,
    totalReturnPct: invested > 0 ? ((value - invested) / invested) * 100 : null,
  }
}
