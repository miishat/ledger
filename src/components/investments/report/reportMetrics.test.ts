import type { PABenchmarkPoint, PAReport, PASymbolPerf } from '../../../utils/investments/ibkrPortfolioAnalyst'
import { accountValue, benchmarkDelta, contributors, feeTotal, formatReportMonth, growthSeries, incomeTotals } from './reportMetrics'
import { sampleReport } from './testFixtures'

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

describe('formatReportMonth', () => {
  it('renders IBKR YYYYMM months as a short month and year', () => {
    expect(formatReportMonth('202601')).toBe('Jan 2026')
    expect(formatReportMonth('202612')).toBe('Dec 2026')
  })

  it('passes through anything that is not a valid YYYYMM', () => {
    expect(formatReportMonth('2026-01')).toBe('2026-01')
    expect(formatReportMonth('202613')).toBe('202613')
    expect(formatReportMonth('')).toBe('')
  })
})

describe('accountValue', () => {
  const withAssetClass = (rows: PAReport['assetClassAllocation']): PAReport =>
    ({ ...sampleReport, assetClassAllocation: rows })

  it('returns null when there is no report', () => {
    expect(accountValue(null)).toBeNull()
  })

  it('returns null when the report carried no key statistics', () => {
    expect(accountValue({ ...sampleReport, keyStats: undefined })).toBeNull()
  })

  it('reads ending NAV and the cash sleeve', () => {
    const v = accountValue(withAssetClass([
      { name: 'Stocks', endingNav: 100000, endingPct: 84.7 },
      { name: 'Cash', endingNav: 18000, endingPct: 15.3 },
    ]))
    expect(v).toEqual({ nav: 118000, cash: 18000, baseCurrency: 'CAD' })
  })

  it('keeps a negative cash balance for a margin account', () => {
    const v = accountValue(withAssetClass([{ name: 'Cash', endingNav: -25000, endingPct: -21.2 }]))
    expect(v?.cash).toBe(-25000)
    expect(v?.nav).toBe(118000)
  })

  it('reports null cash when the report has no cash row', () => {
    expect(accountValue(withAssetClass([{ name: 'Stocks', endingNav: 118000, endingPct: 100 }]))?.cash).toBeNull()
  })

  it('preserves a non-CAD base currency rather than converting', () => {
    expect(accountValue({ ...sampleReport, baseCurrency: 'USD' })?.baseCurrency).toBe('USD')
  })
})

describe('growthSeries ordering', () => {
  it('compounds oldest-first even when the report rows arrive newest-first', () => {
    const descending: PABenchmarkPoint[] = [
      { month: '202603', account: 10, benchmarks: { SPX: 0 } },
      { month: '202602', account: -10, benchmarks: { SPX: 0 } },
      { month: '202601', account: 10, benchmarks: { SPX: 0 } },
    ]
    const { data } = growthSeries(descending)
    expect(data.map((d) => d.month)).toEqual(['202601', '202602', '202603'])
    // 100 -> 110 -> 99 -> 108.9, i.e. the same result as the ascending input.
    expect(data.map((d) => d.Account)).toEqual([110, 99, 108.9])
  })

  it('gives an out-of-order input the same result as a sorted one', () => {
    const points: PABenchmarkPoint[] = [
      { month: '202601', account: 5, benchmarks: { SPX: 1 } },
      { month: '202602', account: 3, benchmarks: { SPX: 2 } },
      { month: '202603', account: -4, benchmarks: { SPX: 1 } },
    ]
    const shuffled = [points[2], points[0], points[1]]
    expect(growthSeries(shuffled)).toEqual(growthSeries(points))
  })

  it('does not mutate the caller array', () => {
    const points: PABenchmarkPoint[] = [
      { month: '202603', account: 1, benchmarks: {} },
      { month: '202601', account: 2, benchmarks: {} },
    ]
    growthSeries(points)
    expect(points.map((p) => p.month)).toEqual(['202603', '202601'])
  })
})
