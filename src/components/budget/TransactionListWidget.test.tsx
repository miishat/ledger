import { render, screen } from '@testing-library/react'
import { TransactionListWidget } from './TransactionListWidget'
import { useBudgetStore } from '../../store/useBudgetStore'

const initialState = useBudgetStore.getState()

beforeEach(() => {
  useBudgetStore.setState(initialState, true)
})

describe('TransactionListWidget mobile layout', () => {
  it('lets the header row wrap instead of overflowing the card', () => {
    render(<TransactionListWidget selectedMonth="2026-07" />)
    const headerRow = screen.getByText('All Transactions').parentElement as HTMLElement
    expect(headerRow.className).toContain('flex-wrap')
  })

  it('shows the delete button without hover on mobile, hover-revealed from sm up', () => {
    useBudgetStore.setState({
      transactions: {
        tx1: {
          id: 'tx1',
          date: '2026-07-03',
          amount: 42,
          description: 'Coffee',
          type: 'expense',
        },
      },
    })
    render(<TransactionListWidget selectedMonth="2026-07" />)
    const del = screen.getByLabelText('Delete transaction')
    const classes = del.className.split(/\s+/)
    expect(classes).not.toContain('opacity-0') // bare opacity-0 would hide it on touch
    expect(classes).toContain('sm:opacity-0')
    expect(classes).toContain('sm:group-hover:opacity-100')
  })
})
