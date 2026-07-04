// Per-category expense stats and anomaly detection (vs a 3-month rolling
// average of completed months). Thresholds exported for UI copy.

import type { Category, Transaction } from '../../types/budget'

export const ANOMALY_RATIO = 1.5
export const ANOMALY_MIN_DELTA = 50

export function categoryMonthlyTotal(
  transactions: Record<string, Transaction>,
  categoryId: string,
  month: string,
): number {
  return Object.values(transactions)
    .filter((t) => t.type === 'expense' && t.categoryId === categoryId && t.date.startsWith(month))
    .reduce((s, t) => s + t.amount, 0)
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function categoryMonthlySeries(
  transactions: Record<string, Transaction>,
  categoryId: string,
  monthsBack: number,
  refDate: Date = new Date(),
): { month: string; total: number }[] {
  const series: { month: string; total: number }[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1)
    const month = monthKey(d)
    series.push({ month, total: categoryMonthlyTotal(transactions, categoryId, month) })
  }
  return series
}

export interface Anomaly {
  categoryId: string
  monthSpend: number
  rollingAvg: number
  ratio: number
}

export function detectAnomalies(
  transactions: Record<string, Transaction>,
  categories: Record<string, Category>,
  month: string,
  refDate: Date = new Date(),
): Anomaly[] {
  const anomalies: Anomaly[] = []
  for (const cat of Object.values(categories)) {
    const monthSpend = categoryMonthlyTotal(transactions, cat.id, month)
    if (monthSpend <= 0) continue
    const prior: number[] = []
    for (let i = 1; i <= 3; i++) {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1)
      prior.push(categoryMonthlyTotal(transactions, cat.id, monthKey(d)))
    }
    const rollingAvg = prior.reduce((a, b) => a + b, 0) / prior.length
    if (rollingAvg <= 0) continue
    if (monthSpend > rollingAvg * ANOMALY_RATIO && monthSpend - rollingAvg > ANOMALY_MIN_DELTA) {
      anomalies.push({ categoryId: cat.id, monthSpend, rollingAvg, ratio: monthSpend / rollingAvg })
    }
  }
  return anomalies.sort((a, b) => b.ratio - a.ratio)
}
