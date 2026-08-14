import { splitParts, amountForCategory, splitRemainder, round2 } from './splits'
import type { Transaction } from '../../types/budget'

const base: Transaction = {
  id: 't1',
  date: '2026-08-04',
  amount: 180,
  description: 'Costco',
  type: 'expense',
  categoryId: 'groceries',
}

describe('splitParts', () => {
  it('gives an unsplit transaction one part for its whole amount', () => {
    expect(splitParts(base)).toEqual([{ categoryId: 'groceries', amount: 180 }])
  })

  it('treats an empty splits array as unsplit', () => {
    expect(splitParts({ ...base, splits: [] })).toEqual([{ categoryId: 'groceries', amount: 180 }])
  })

  it('returns the split parts when they cover the full amount', () => {
    const tx = { ...base, splits: [
      { categoryId: 'groceries', amount: 120 },
      { categoryId: 'household', amount: 60 },
    ] }
    expect(splitParts(tx)).toEqual([
      { categoryId: 'groceries', amount: 120 },
      { categoryId: 'household', amount: 60 },
    ])
  })

  it('keeps an uncovered remainder on the transaction category so totals never shrink', () => {
    const tx = { ...base, splits: [{ categoryId: 'household', amount: 50 }] }
    expect(splitParts(tx)).toEqual([
      { categoryId: 'household', amount: 50 },
      { categoryId: 'groceries', amount: 130 },
    ])
  })

  it('ignores an over-covering remainder rather than emitting a negative part', () => {
    const tx = { ...base, splits: [{ categoryId: 'household', amount: 200 }] }
    expect(splitParts(tx)).toEqual([{ categoryId: 'household', amount: 200 }])
  })

  it('carries an undefined categoryId through as uncategorized', () => {
    const tx = { ...base, categoryId: undefined, splits: [{ amount: 180 }] }
    expect(splitParts(tx)).toEqual([{ categoryId: undefined, amount: 180 }])
  })
})

describe('amountForCategory', () => {
  it('sums every part matching the category', () => {
    const tx = { ...base, splits: [
      { categoryId: 'household', amount: 40 },
      { categoryId: 'household', amount: 20 },
      { categoryId: 'groceries', amount: 120 },
    ] }
    expect(amountForCategory(tx, 'household')).toBe(60)
  })

  it('is zero for a category the transaction does not touch', () => {
    expect(amountForCategory(base, 'rent')).toBe(0)
  })
})

describe('splitRemainder', () => {
  it('reports what is left to allocate, rounded to cents', () => {
    expect(splitRemainder(100, [{ amount: 33.33 }, { amount: 33.33 }])).toBe(33.34)
  })
})

describe('round2', () => {
  it('rounds to two decimals', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3)
  })
})
