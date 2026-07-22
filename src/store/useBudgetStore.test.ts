import { describe, it, expect } from 'vitest'
import { migrateBudgetState, migrateBudgetStateV3 } from './useBudgetStore'

describe('budget store migration v1 -> v2', () => {
  it('assigns kind=income to income-named groups, expense otherwise', () => {
    const v1 = {
      categoryGroups: {
        'g-2': { id: 'g-2', name: 'Income' },
        'g-h': { id: 'g-h', name: 'Housing' },
        'g-e': { id: 'g-e', name: 'Side Earnings' },
      },
    }
    const out = migrateBudgetState(v1, 1) as {
      categoryGroups: Record<string, { kind: string }>
    }
    expect(out.categoryGroups['g-2'].kind).toBe('income')
    expect(out.categoryGroups['g-e'].kind).toBe('income')
    expect(out.categoryGroups['g-h'].kind).toBe('expense')
  })
})

describe('budget store migration v2 -> v3', () => {
  it('remaps out-of-type paradigms to Ledger Custom', () => {
    expect((migrateBudgetStateV3({ paradigm: 'Envelope' }) as { paradigm: string }).paradigm).toBe('Ledger Custom')
    expect((migrateBudgetStateV3({ paradigm: 'Zero-Based' }) as { paradigm: string }).paradigm).toBe('Zero-Based')
    expect((migrateBudgetStateV3({ paradigm: '50/30/20' }) as { paradigm: string }).paradigm).toBe('50/30/20')
    expect((migrateBudgetStateV3({}) as { paradigm: string }).paradigm).toBe('Ledger Custom')
  })

  it('classifies known seeded expense groups and leaves others alone', () => {
    const v2 = {
      paradigm: 'Ledger Custom',
      categoryGroups: {
        h: { id: 'h', name: 'Housing', kind: 'expense' },
        e: { id: 'e', name: 'Entertainment', kind: 'expense' },
        x: { id: 'x', name: 'Mystery', kind: 'expense' },
        i: { id: 'i', name: 'Income', kind: 'income' },
        pre: { id: 'pre', name: 'Food', kind: 'expense', budgetClass: 'want' },
      },
    }
    const out = migrateBudgetStateV3(v2) as { categoryGroups: Record<string, { budgetClass?: string }> }
    expect(out.categoryGroups.h.budgetClass).toBe('need')
    expect(out.categoryGroups.e.budgetClass).toBe('want')
    expect(out.categoryGroups.x.budgetClass).toBeUndefined()
    expect(out.categoryGroups.i.budgetClass).toBeUndefined()
    expect(out.categoryGroups.pre.budgetClass).toBe('want') // never overwrites an explicit class
  })
})

import { getMonthlyBudgetStats, useBudgetStore } from './useBudgetStore'
import type { BudgetingParadigm } from '../types/budget'

function makeState(paradigm: BudgetingParadigm) {
  return {
    paradigm,
    budgetSetupCollapsed: true,
    categoryGroups: {
      gi: { id: 'gi', name: 'Income', kind: 'income' as const },
      gn: { id: 'gn', name: 'Housing', kind: 'expense' as const, budgetClass: 'need' as const },
      gw: { id: 'gw', name: 'Fun', kind: 'expense' as const, budgetClass: 'want' as const },
      gs: { id: 'gs', name: 'Investing', kind: 'expense' as const, budgetClass: 'savings' as const },
      gu: { id: 'gu', name: 'Mystery', kind: 'expense' as const },
    },
    categories: {
      inc: { id: 'inc', groupId: 'gi', name: 'Salary', targetAmount: 0 },
      rent: { id: 'rent', groupId: 'gn', name: 'Rent', targetAmount: 1000 },
      games: { id: 'games', groupId: 'gw', name: 'Games', targetAmount: 200 },
      etf: { id: 'etf', groupId: 'gs', name: 'ETF', targetAmount: 500 },
      misc: { id: 'misc', groupId: 'gu', name: 'Misc', targetAmount: 100 },
    },
    transactions: {
      t1: { id: 't1', date: '2026-07-01', amount: 4000, categoryId: 'inc', description: 'pay', type: 'income' as const },
      t2: { id: 't2', date: '2026-07-02', amount: 1200, categoryId: 'rent', description: 'rent', type: 'expense' as const },
      t3: { id: 't3', date: '2026-07-03', amount: 150, categoryId: 'games', description: 'game', type: 'expense' as const },
      t4: { id: 't4', date: '2026-07-04', amount: 500, categoryId: 'etf', description: 'buy', type: 'expense' as const },
      t5: { id: 't5', date: '2026-07-05', amount: 50, categoryId: 'misc', description: '?', type: 'expense' as const },
    },
    reallocations: {},
  }
}

describe('getMonthlyBudgetStats paradigm blocks', () => {
  // Targets total 1800, income 4000, spent 1900. Rent overspends by 200.
  it('computes per-category overspend and zero-based flags', () => {
    const stats = getMonthlyBudgetStats(makeState('Zero-Based') as never, 2026, 6)
    expect(stats.perCategory.rent.overspend).toBe(200)
    expect(stats.perCategory.games.overspend).toBe(0)
    expect(stats.zeroBased.unassigned).toBe(4000 - 1800)
    expect(stats.zeroBased.overspentCategoryIds).toEqual(['rent'])
    expect(stats.perCategory.inc).toBeUndefined() // income categories excluded
  })

  it('reallocation coverage clears the zero-based flag', () => {
    const state = makeState('Zero-Based')
    ;(state.reallocations as Record<string, unknown>).r1 = {
      id: 'r1', fromCategoryId: 'misc', toCategoryId: 'rent', amount: 200, date: '2026-07-06',
    }
    const stats = getMonthlyBudgetStats(state as never, 2026, 6)
    expect(stats.perCategory.rent.effectiveTarget).toBe(1200)
    expect(stats.zeroBased.overspentCategoryIds).toEqual(['misc']) // rent covered by realloc, but misc (the donor) now overspends its reduced target
    expect(stats.perCategory.misc.overspend).toBe(150) // misc now over its reduced target
    expect(stats.zeroBased.unassigned).toBe(2200) // reallocations never change unassigned
  })

  it('target-based buffer absorbs overspend and flags negative', () => {
    const stats = getMonthlyBudgetStats(makeState('Target-Based') as never, 2026, 6)
    expect(stats.targetBased.buffer).toBe(2200 - 200) // unallocated minus total overspend
    expect(stats.targetBased.negative).toBe(false)
  })

  it('50/30/20 buckets: unclassified counts as need, pct of income', () => {
    const stats = getMonthlyBudgetStats(makeState('50/30/20') as never, 2026, 6)
    expect(stats.fiftyThirtyTwenty.needsSpent).toBe(1200 + 50) // rent + unclassified misc
    expect(stats.fiftyThirtyTwenty.wantsSpent).toBe(150)
    expect(stats.fiftyThirtyTwenty.savingsSpent).toBe(500)
    expect(stats.fiftyThirtyTwenty.needsPct).toBeCloseTo((1250 / 4000) * 100)
    expect(stats.fiftyThirtyTwenty.hasUnclassified).toBe(true)
  })

  it('50/30/20 pct are 0 on zero-income months', () => {
    const state = makeState('50/30/20')
    delete (state.transactions as Record<string, unknown>).t1
    const stats = getMonthlyBudgetStats(state as never, 2026, 6)
    expect(stats.fiftyThirtyTwenty.needsPct).toBe(0)
    expect(stats.fiftyThirtyTwenty.savingsPct).toBe(0)
  })

  it('keeps legacy top-level numbers unchanged', () => {
    const stats = getMonthlyBudgetStats(makeState('Ledger Custom') as never, 2026, 6)
    expect(stats.spent).toBe(1900)
    expect(stats.unallocated).toBe(2200) // brief said 2100; corrected to match income(4000) - totalTarget(1800), consistent with zeroBased.unassigned and targetBased.buffer tests above
    expect(stats.remaining).toBe(1800 - 1900)
  })
})

describe('getMonthlyBudgetStats with annual categories', () => {
  it('uses the monthly equivalent as the effective target', () => {
    useBudgetStore.setState({
      transactions: {},
      categoryGroups: { g1: { id: 'g1', name: 'Travel', kind: 'expense' } },
      categories: {
        c1: { id: 'c1', groupId: 'g1', name: 'Vacation', targetAmount: 2400, cadence: 'annual' },
      },
      reallocations: {},
    })
    const stats = getMonthlyBudgetStats(useBudgetStore.getState(), 2026, 6)
    expect(stats.perCategory.c1.effectiveTarget).toBe(200)
  })

  it('applies reallocations on top of the monthly equivalent', () => {
    useBudgetStore.setState({
      transactions: {},
      categoryGroups: { g1: { id: 'g1', name: 'Travel', kind: 'expense' } },
      categories: {
        c1: { id: 'c1', groupId: 'g1', name: 'Vacation', targetAmount: 2400, cadence: 'annual' },
        c2: { id: 'c2', groupId: 'g1', name: 'Rent', targetAmount: 1000 },
      },
      reallocations: {
        r1: { id: 'r1', fromCategoryId: 'c2', toCategoryId: 'c1', amount: 50, date: '2026-07-05' },
      },
    })
    const stats = getMonthlyBudgetStats(useBudgetStore.getState(), 2026, 6)
    expect(stats.perCategory.c1.effectiveTarget).toBe(250)
    expect(stats.perCategory.c2.effectiveTarget).toBe(950)
  })
})
