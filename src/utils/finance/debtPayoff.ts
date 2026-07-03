// Multi-debt payoff simulation. Each month: interest accrues (apr/12), every
// live debt gets its minimum payment, and the extra budget — extraMonthly
// plus the minimums freed by cleared debts — goes to the focus debt:
// snowball = lowest balance first, avalanche = highest APR first.

export interface Debt {
  id: string
  name: string
  balance: number
  aprPct: number
  minPayment: number
}

export type PayoffStrategy = 'snowball' | 'avalanche'

export interface PayoffResult {
  /** Months to debt-free, or null if not reached within maxMonths. */
  months: number | null
  totalInterest: number
  series: { month: number; total: number }[]
  /** Debt ids in the order they were fully paid. */
  payoffOrder: string[]
}

export function simulatePayoff(
  debts: Debt[],
  extraMonthly: number,
  strategy: PayoffStrategy,
  maxMonths = 600,
): PayoffResult {
  const live = debts.map((d) => ({ ...d }))
  const totalMin = debts.reduce((s, d) => s + d.minPayment, 0)
  const series = [{ month: 0, total: live.reduce((s, d) => s + d.balance, 0) }]
  const payoffOrder: string[] = []
  let totalInterest = 0

  for (let month = 1; month <= maxMonths; month++) {
    // 1. Accrue interest.
    for (const d of live) {
      if (d.balance <= 0) continue
      const interest = (d.balance * d.aprPct) / 100 / 12
      d.balance += interest
      totalInterest += interest
    }
    // 2-3. Apply all available budget (minimum + extra) in strategy order.
    let budget = extraMonthly + totalMin
    const order = [...live]
      .filter((d) => d.balance > 0)
      .sort((a, b) => (strategy === 'snowball' ? a.balance - b.balance : b.aprPct - a.aprPct))
    for (const d of order) {
      if (budget <= 0) break
      const pay = Math.min(budget, d.balance)
      d.balance -= pay
      budget -= pay
    }
    // 4. Record clears + series point.
    for (const d of live) {
      if (d.balance <= 1e-6 && !payoffOrder.includes(d.id)) {
        d.balance = 0
        payoffOrder.push(d.id)
      }
    }
    const total = live.reduce((s, d) => s + d.balance, 0)
    series.push({ month, total })
    if (total <= 0) return { months: month, totalInterest, series, payoffOrder }
  }
  return { months: null, totalInterest, series, payoffOrder }
}
