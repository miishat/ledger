import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SavingsRateWidget } from './SavingsRateWidget'
import { useBudgetStore } from '../../store/useBudgetStore'

afterEach(() => {
  useBudgetStore.setState({ transactions: {} })
})

describe('SavingsRateWidget', () => {
  it('shows the savings rate and income/expense legend for the trailing window', () => {
    useBudgetStore.setState({
      transactions: {
        i: { id: 'i', date: '2026-06-10', amount: 5000, description: 'Salary', type: 'income' },
        e: { id: 'e', date: '2026-06-12', amount: 2500, description: 'Rent', type: 'expense' },
      },
    })
    render(<SavingsRateWidget range={{ from: '2026-06', to: '2026-06' }} />)
    expect(screen.getByText('Savings Rate (6 Months)')).toBeInTheDocument()
    // income 5000, expense 2500 over the window -> 50%
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
  })

  it('renders an empty state when the window has no income or expenses', () => {
    useBudgetStore.setState({ transactions: {} })
    render(<SavingsRateWidget range={{ from: '2026-06', to: '2026-06' }} />)
    expect(screen.getByText('No income or expenses in this window yet.')).toBeInTheDocument()
  })
})
