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
})
