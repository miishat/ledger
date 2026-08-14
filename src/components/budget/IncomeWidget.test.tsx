import { render, screen } from '@testing-library/react'
import { IncomeWidget } from './IncomeWidget'
import { useBudgetStore } from '../../store/useBudgetStore'

const budgetInitial = useBudgetStore.getState()

beforeEach(() => {
  useBudgetStore.setState(budgetInitial, true)
})

const range = { from: '2026-08', to: '2026-08' }

describe('IncomeWidget', () => {
  it('totals income inside the range only', () => {
    useBudgetStore.setState({
      transactions: {
        i1: { id: 'i1', date: '2026-08-05', amount: 3000, description: 'Pay', type: 'income' },
        i2: { id: 'i2', date: '2026-07-05', amount: 9999, description: 'Old pay', type: 'income' },
      },
    })
    render(<IncomeWidget range={range} />)
    expect(screen.getAllByText(/3,000/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/9,999/)).not.toBeInTheDocument()
  })

  it('breaks income down by category name', () => {
    useBudgetStore.setState({
      categories: { c1: { id: 'c1', groupId: 'g1', name: 'Salary', targetAmount: 0 } },
      transactions: {
        i1: { id: 'i1', date: '2026-08-05', amount: 3000, description: 'Pay', type: 'income', categoryId: 'c1' },
      },
    })
    render(<IncomeWidget range={range} />)
    expect(screen.getByText('Salary')).toBeInTheDocument()
  })

  it('files uncategorized income under Other income', () => {
    useBudgetStore.setState({
      transactions: {
        i1: { id: 'i1', date: '2026-08-05', amount: 500, description: 'Cash gift', type: 'income' },
      },
    })
    render(<IncomeWidget range={range} />)
    expect(screen.getByText('Other income')).toBeInTheDocument()
  })

  it('excludes an expense from the income total', () => {
    useBudgetStore.setState({
      transactions: {
        e1: { id: 'e1', date: '2026-08-05', amount: 40, description: 'Groceries', type: 'expense' },
      },
    })
    render(<IncomeWidget range={range} />)
    expect(screen.queryByText(/\$40/)).not.toBeInTheDocument()
  })
})
