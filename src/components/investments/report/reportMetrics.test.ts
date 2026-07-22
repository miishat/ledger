import type { PABenchmarkPoint, PASymbolPerf } from '../../../utils/investments/ibkrPortfolioAnalyst'
import { benchmarkDelta, contributors, feeTotal, growthSeries, incomeTotals } from './reportMetrics'

const sym = (symbol: string, contribution: number): PASymbolPerf => ({
  symbol, description: '', instrument: '', sector: '',
  avgWeight: 0, totalReturn: 0, contribution, unrealizedPl: 0, realizedPl: 0, open: true,
})

describe('growthSeries', () => {
  it('compounds monthly percentage returns from a base of 100', () => {
    const points: PABenchmarkPoint[] = [
      { month: '2026-01', account: 10, benchmarks: { SPX: 5 } },
      { month: '2026-02', account: -10, benchmarks: { SPX: 5 } },
    ]
    const { names, data } = growthSeries(points)
    expect(names).toEqual(['Account', 'SPX'])
    expect(data[0].Account).toBe(110)
    expect(data[1].Account).toBe(99)
    expect(data[1].SPX).toBe(110.25)
  })

  it('returns empty names and data for no points', () => {
    expect(growthSeries([])).toEqual({ names: [], data: [] })
  })
})

describe('contributors', () => {
  it('splits into top gainers and bottom detractors', () => {
    const rows = [sym('A', 3), sym('B', -2), sym('C', 1), sym('D', -5)]
    const { top, bottom } = contributors(rows, 2)
    expect(top.map((r) => r.symbol)).toEqual(['A', 'C'])
    expect(bottom.map((r) => r.symbol)).toEqual(['D', 'B'])
  })

  it('never puts the same symbol in both buckets', () => {
    const rows = [sym('A', 3)]
    const { top, bottom } = contributors(rows, 5)
    expect(top.map((r) => r.symbol)).toEqual(['A'])
    expect(bottom).toEqual([])
  })

  it('ignores exact zeros', () => {
    const { top, bottom } = contributors([sym('A', 0)], 5)
    expect(top).toEqual([])
    expect(bottom).toEqual([])
  })
})

describe('incomeTotals', () => {
  it('sums received dividends and projected annual income', () => {
    const totals = incomeTotals(
      [{ payDate: '2026-01-05', symbol: 'A', quantity: 1, perShare: 1, amount: 40 },
       { payDate: '2026-04-05', symbol: 'A', quantity: 1, perShare: 1, amount: 60 }],
      [{ symbol: 'A', description: '', frequency: 'Quarterly', quantity: 1, value: 100, currentYieldPct: 4, estAnnualIncome: 400 }],
    )
    expect(totals.dividends).toBe(100)
    expect(totals.projectedAnnual).toBe(400)
  })
})

describe('feeTotal', () => {
  it('nets fees and credits', () => {
    expect(feeTotal([
      { date: '2026-01-01', description: 'Commission', amount: -12 },
      { date: '2026-02-01', description: 'Rebate', amount: 2 },
    ])).toBe(-10)
  })
})

describe('benchmarkDelta', () => {
  it('is the account minus the first benchmark since inception', () => {
    const row = (name: string, inception: number) => ({
      name, mtd: 0, qtd: 0, ytd: 0, oneYear: 0, threeYear: 0, fiveYear: 0, inception,
    })
    expect(benchmarkDelta([row('Account', 12), row('SPX', 9)])).toBeCloseTo(3, 5)
  })

  it('is null without a benchmark to compare against', () => {
    expect(benchmarkDelta([])).toBeNull()
  })
})
