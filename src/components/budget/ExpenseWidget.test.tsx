import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExpenseWidget } from './ExpenseWidget'
import { useBudgetStore } from '../../store/useBudgetStore'

describe('ExpenseWidget', () => {
  it('renders $0.00 without an empty-state message when there are no expenses', () => {
    useBudgetStore.setState({ transactions: {}, categories: {} })
    render(<ExpenseWidget range={{ from: '2026-07', to: '2026-07' }} />)
    expect(screen.getByText('Expenses')).toBeTruthy()
    expect(screen.getByText(/\$0/)).toBeTruthy()
    expect(screen.queryByText(/No expenses this month/i)).toBeNull()
  })

  it('splits a transaction across the two groups its slices belong to', () => {
    useBudgetStore.setState({
      categoryGroups: {
        g1: { id: 'g1', name: 'Food', kind: 'expense' },
        g2: { id: 'g2', name: 'Shopping', kind: 'expense' },
      },
      categories: {
        groceries: { id: 'groceries', groupId: 'g1', name: 'Groceries', targetAmount: 0 },
        household: { id: 'household', groupId: 'g2', name: 'Household', targetAmount: 0 },
      },
      transactions: {
        t1: {
          id: 't1',
          date: '2026-08-04',
          amount: 180,
          description: 'Costco',
          type: 'expense',
          categoryId: 'groceries',
          splits: [
            { categoryId: 'groceries', amount: 120 },
            { categoryId: 'household', amount: 60 },
          ],
        },
      },
    })
    render(<ExpenseWidget range={{ from: '2026-08', to: '2026-08' }} />)
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Shopping')).toBeInTheDocument()
  })
})
