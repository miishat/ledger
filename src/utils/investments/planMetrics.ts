import type { Position } from '../../store/useAnalysisStore'
import { currentValue, totalInvested } from './analysisMetrics'

export interface PlanRow {
  positionId: string
  ticker: string
  allocationPct: number
  extra: number
  initialInvestment: number
  startPrice: number
  shares: number
  currentPrice: number
  currentValue: number
  returnDollars: number
  returnPct: number | null
}

export function planRow(position: Position, initialFund: number, currentPrice: number): PlanRow {
  const allocationPct = position.allocationPct ?? 0
  const extra = position.extraPlanned ?? 0
  const initialInvestment = (initialFund * allocationPct) / 100
  const totalIn = initialInvestment + extra
  const shares = position.startPrice > 0 ? totalIn / position.startPrice : 0
  const value = shares * currentPrice
  const returnDollars = value - totalIn
  return {
    positionId: position.id,
    ticker: position.ticker,
    allocationPct,
    extra,
    initialInvestment,
    startPrice: position.startPrice,
    shares,
    currentPrice,
    currentValue: value,
    returnDollars,
    returnPct: totalIn > 0 ? (returnDollars / totalIn) * 100 : null,
  }
}

export interface FundSummary {
  initialFund: number
  extraFund: number
  totalFund: number
  currentValue: number
  totalReturnPct: number | null
}

export function planFundSummary(rows: PlanRow[], initialFund: number, extraFund: number): FundSummary {
  const totalFund = initialFund + extraFund
  const value = rows.reduce((s, r) => s + r.currentValue, 0)
  return {
    initialFund,
    extraFund,
    totalFund,
    currentValue: value,
    totalReturnPct: totalFund > 0 ? ((value - totalFund) / totalFund) * 100 : null,
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
