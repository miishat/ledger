import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryManagerWidget } from './CategoryManagerWidget'
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
})
