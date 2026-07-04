import type { Category, Transaction } from '../../types/budget'
import { categoryMonthlySeries, categoryMonthlyTotal, detectAnomalies } from './categoryStats'

let id = 0
const tx = (date: string, amount: number, categoryId: string): Transaction =>
  ({ id: `t${id++}`, date, amount, categoryId, description: 'x', type: 'expense' })
const asRecord = (list: Transaction[]) => Object.fromEntries(list.map((t) => [t.id, t]))

const categories: Record<string, Category> = {
  dining: { id: 'dining', groupId: 'g', name: 'Dining', targetAmount: 200 },
  rent: { id: 'rent', groupId: 'g', name: 'Rent', targetAmount: 1000 },
}

const txs = asRecord([
  tx('2026-04-10', 100, 'dining'), tx('2026-05-12', 120, 'dining'), tx('2026-06-15', 110, 'dining'),
  tx('2026-07-01', 400, 'dining'), // July blowout: avg(100,120,110)=110 → ratio 3.6
  tx('2026-04-01', 1000, 'rent'), tx('2026-05-01', 1000, 'rent'),
  tx('2026-06-01', 1000, 'rent'), tx('2026-07-01', 1000, 'rent'), // steady
])

describe('categoryMonthlyTotal / series', () => {
  it('sums a category month', () => {
    expect(categoryMonthlyTotal(txs, 'dining', '2026-05')).toBe(120)
    expect(categoryMonthlyTotal(txs, 'dining', '2026-01')).toBe(0)
  })

  it('builds an oldest-to-newest series ending at the reference month', () => {
    const s = categoryMonthlySeries(txs, 'dining', 4, new Date('2026-07-15T12:00:00'))
    expect(s.map((p) => p.month)).toEqual(['2026-04', '2026-05', '2026-06', '2026-07'])
    expect(s.map((p) => p.total)).toEqual([100, 120, 110, 400])
  })
})

describe('detectAnomalies', () => {
  it('flags the blowout month and not the steady category', () => {
    const anomalies = detectAnomalies(txs, categories, '2026-07', new Date('2026-07-15T12:00:00'))
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0]).toMatchObject({ categoryId: 'dining', monthSpend: 400, rollingAvg: 110 })
    expect(anomalies[0].ratio).toBeCloseTo(400 / 110, 6)
  })

  it('ignores small-dollar spikes (under the $50 floor)', () => {
    const small = asRecord([
      tx('2026-04-10', 10, 'dining'), tx('2026-05-12', 10, 'dining'),
      tx('2026-06-15', 10, 'dining'), tx('2026-07-01', 40, 'dining'),
    ])
    expect(detectAnomalies(small, categories, '2026-07', new Date('2026-07-15T12:00:00'))).toHaveLength(0)
  })
})
