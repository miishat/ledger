import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryManagerWidget, PARADIGM_DESCRIPTIONS } from './CategoryManagerWidget'
import { useBudgetStore } from '../../store/useBudgetStore'

beforeEach(() => {
  useBudgetStore.setState({
    paradigm: '50/30/20',
    budgetSetupCollapsed: false,
    transactions: {},
    reallocations: {},
    categoryGroups: {
      g1: { id: 'g1', name: 'Housing', kind: 'expense', budgetClass: 'need' },
      g2: { id: 'g2', name: 'Income', kind: 'income' },
    },
    categories: {
      c1: { id: 'c1', groupId: 'g1', name: 'Rent', targetAmount: 100 },
    },
  })
})

describe('CategoryManagerWidget paradigm controls', () => {
  it('shows the description for the active paradigm', () => {
    render(<CategoryManagerWidget selectedMonth="2026-07" />)
    expect(screen.getByText(/50% of income on needs/i)).toBeInTheDocument()
  })

  it('shows class chips on expense groups only under 50/30/20 and updates the class', () => {
    render(<CategoryManagerWidget selectedMonth="2026-07" />)
    const wantChip = screen.getByRole('button', { name: 'Set Housing class to want' })
    fireEvent.click(wantChip)
    expect(useBudgetStore.getState().categoryGroups.g1.budgetClass).toBe('want')
    expect(screen.queryByRole('button', { name: /Set Income class/ })).toBeNull()
  })

  it('hides class chips under other paradigms', () => {
    useBudgetStore.setState({ paradigm: 'Zero-Based' })
    render(<CategoryManagerWidget selectedMonth="2026-07" />)
    expect(screen.queryByRole('button', { name: /class to want/ })).toBeNull()
  })

  it('every paradigm description is short enough for one line', () => {
    for (const desc of Object.values(PARADIGM_DESCRIPTIONS)) {
      expect(desc.length).toBeLessThanOrEqual(70)
    }
  })
})

describe('CategoryManagerWidget overspend gating', () => {
  it('Zero-Based: shows Cover button for a zero-target category with spending, and opens the dialog', () => {
    useBudgetStore.setState({
      paradigm: 'Zero-Based',
      budgetSetupCollapsed: false,
      transactions: {
        t1: { id: 't1', date: '2026-07-05', amount: 40, categoryId: 'c1', description: 'Groceries', type: 'expense' },
      },
      reallocations: {},
      categoryGroups: {
        g1: { id: 'g1', name: 'Housing', kind: 'expense', budgetClass: 'need' },
      },
      categories: {
        c1: { id: 'c1', groupId: 'g1', name: 'Rent', targetAmount: 0 },
      },
    })
    render(<CategoryManagerWidget selectedMonth="2026-07" />)
    const coverButton = screen.getByRole('button', { name: 'Cover' })
    expect(coverButton).toBeInTheDocument()
    fireEvent.click(coverButton)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('Target-Based: shows "absorbed by buffer" and no Cover button for an overspent category', () => {
    useBudgetStore.setState({
      paradigm: 'Target-Based',
      budgetSetupCollapsed: false,
      transactions: {
        t1: { id: 't1', date: '2026-07-05', amount: 150, categoryId: 'c1', description: 'Groceries', type: 'expense' },
      },
      reallocations: {},
      categoryGroups: {
        g1: { id: 'g1', name: 'Housing', kind: 'expense', budgetClass: 'need' },
      },
      categories: {
        c1: { id: 'c1', groupId: 'g1', name: 'Rent', targetAmount: 100 },
      },
    })
    render(<CategoryManagerWidget selectedMonth="2026-07" />)
    expect(screen.getByText(/absorbed by buffer/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cover' })).toBeNull()
  })

  it('Ledger Custom: shows neither the Cover button nor the absorbed-by-buffer note', () => {
    useBudgetStore.setState({
      paradigm: 'Ledger Custom',
      budgetSetupCollapsed: false,
      transactions: {
        t1: { id: 't1', date: '2026-07-05', amount: 150, categoryId: 'c1', description: 'Groceries', type: 'expense' },
      },
      reallocations: {},
      categoryGroups: {
        g1: { id: 'g1', name: 'Housing', kind: 'expense', budgetClass: 'need' },
      },
      categories: {
        c1: { id: 'c1', groupId: 'g1', name: 'Rent', targetAmount: 100 },
      },
    })
    render(<CategoryManagerWidget selectedMonth="2026-07" />)
    expect(screen.queryByRole('button', { name: 'Cover' })).toBeNull()
    expect(screen.queryByText(/absorbed by buffer/i)).toBeNull()
  })
})
