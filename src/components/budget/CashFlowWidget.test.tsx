import { render, screen } from '@testing-library/react'
import { CashFlowWidget } from './CashFlowWidget'
import { useBudgetStore } from '../../store/useBudgetStore'

const budgetInitial = useBudgetStore.getState()

beforeEach(() => {
  useBudgetStore.setState(budgetInitial, true)
})

const range = { from: '2026-08', to: '2026-08' }

describe('CashFlowWidget', () => {
  it('renders its card without data', () => {
    render(<CashFlowWidget range={range} />)
    expect(screen.getByText('Cash Flow')).toBeInTheDocument()
    expect(screen.getByText('No transactions this month.')).toBeInTheDocument()
  })

  it('drops the empty-state message once income and expenses are present', () => {
    useBudgetStore.setState({
      categoryGroups: {
        gi: { id: 'gi', name: 'Income', kind: 'income' },
        ge: { id: 'ge', name: 'Housing', kind: 'expense' },
      },
      categories: {
        ci: { id: 'ci', groupId: 'gi', name: 'Salary', targetAmount: 0 },
        ce: { id: 'ce', groupId: 'ge', name: 'Rent', targetAmount: 0 },
      },
      transactions: {
        i1: { id: 'i1', date: '2026-08-01', amount: 4000, description: 'Pay', type: 'income', categoryId: 'ci' },
        e1: { id: 'e1', date: '2026-08-02', amount: 1500, description: 'Rent', type: 'expense', categoryId: 'ce' },
      },
    })
    render(<CashFlowWidget range={range} />)
    expect(screen.getByText('Cash Flow')).toBeInTheDocument()
    expect(screen.queryByText('No transactions this month.')).not.toBeInTheDocument()
  })
})
