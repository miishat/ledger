import type { Transaction, TransactionSplit } from '../../types/budget'

export interface SplitPart {
  categoryId?: string
  amount: number
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** What is left of `total` after the splits, rounded to cents. Negative when
 *  the splits over-cover the transaction. */
export function splitRemainder(total: number, splits: TransactionSplit[]): number {
  return round2(total - splits.reduce((s, p) => s + p.amount, 0))
}

/** Every (category, amount) pair a transaction contributes to the budget.
 *
 *  This is the ONLY place that decides how a transaction is attributed to a
 *  category. Every widget, selector and stat routes through it, so an unsplit
 *  transaction and a split one cannot drift apart. An unsplit transaction
 *  contributes its whole amount to its own category. A split one contributes
 *  its slices, plus any uncovered remainder on its own category so that the
 *  sum of the parts always equals the transaction amount. */
export function splitParts(tx: Transaction): SplitPart[] {
  const splits = tx.splits
  if (!splits || splits.length === 0) return [{ categoryId: tx.categoryId, amount: tx.amount }]
  const parts: SplitPart[] = splits.map((p) => ({ categoryId: p.categoryId, amount: p.amount }))
  const remainder = splitRemainder(tx.amount, splits)
  if (remainder > 0) parts.push({ categoryId: tx.categoryId, amount: remainder })
  return parts
}

/** Amount this transaction attributes to one category. */
export function amountForCategory(tx: Transaction, categoryId: string): number {
  return splitParts(tx)
    .filter((p) => p.categoryId === categoryId)
    .reduce((s, p) => s + p.amount, 0)
}
