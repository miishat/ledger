// Pure derivations for the PortfolioAnalyst report. Kept free of React and
// recharts so the arithmetic can be tested directly.

import type {
  PABenchmarkPoint, PABenchmarkSummaryRow, PADividend, PAFeeRow,
  PAProjectedIncomeRow, PASymbolPerf,
} from '../../../utils/investments/ibkrPortfolioAnalyst'

export interface GrowthPoint {
  month: string
  [series: string]: string | number
}

/** Cumulative growth of 100 from monthly percentage returns. */
export function growthSeries(points: PABenchmarkPoint[]): { names: string[]; data: GrowthPoint[] } {
  if (points.length === 0) return { names: [], data: [] }
  const names = ['Account', ...Object.keys(points[0].benchmarks)]
  const running: Record<string, number> = Object.fromEntries(names.map((n) => [n, 100]))
  const data = points.map((p) => {
    running.Account *= 1 + p.account / 100
    for (const [bm, r] of Object.entries(p.benchmarks)) {
      if (running[bm] !== undefined) running[bm] *= 1 + r / 100
    }
    return {
      month: p.month,
      ...Object.fromEntries(names.map((n) => [n, Number(running[n].toFixed(2))])),
    } as GrowthPoint
  })
  return { names, data }
}

/** Best and worst contributors. Buckets are disjoint: a symbol is either a
 *  positive contributor or a detractor, never both. Zeros are dropped. */
export function contributors(
  rows: PASymbolPerf[],
  n = 5,
): { top: PASymbolPerf[]; bottom: PASymbolPerf[] } {
  const sorted = [...rows].sort((a, b) => b.contribution - a.contribution)
  return {
    top: sorted.filter((r) => r.contribution > 0).slice(0, n),
    bottom: sorted.filter((r) => r.contribution < 0).slice(-n).reverse(),
  }
}

export function incomeTotals(
  dividends: PADividend[],
  projected: PAProjectedIncomeRow[],
): { dividends: number; projectedAnnual: number } {
  return {
    dividends: dividends.reduce((s, d) => s + d.amount, 0),
    projectedAnnual: projected.reduce((s, p) => s + p.estAnnualIncome, 0),
  }
}

export function feeTotal(fees: PAFeeRow[]): number {
  return fees.reduce((s, f) => s + f.amount, 0)
}

/** Account return minus the first benchmark's, since inception. */
export function benchmarkDelta(summary: PABenchmarkSummaryRow[]): number | null {
  if (summary.length < 2) return null
  return summary[0].inception - summary[1].inception
}
