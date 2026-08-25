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

describe('CashFlowWidget negative group totals', () => {
  it('omits an expense group whose refunds exceed its spending', () => {
    useBudgetStore.setState({
      categoryGroups: { g1: { id: 'g1', name: 'Shopping', kind: 'expense' } },
      categories: { c1: { id: 'c1', groupId: 'g1', name: 'Personal', targetAmount: 0 } },
      transactions: {
        i1: { id: 'i1', date: '2026-08-01', amount: 1000, description: 'PAYROLL', type: 'income', categoryId: '' },
        s1: { id: 's1', date: '2026-08-02', amount: 20, description: 'BUY', type: 'expense', categoryId: 'c1' },
        r1: { id: 'r1', date: '2026-08-03', amount: -50, description: 'REFUND', type: 'expense', categoryId: 'c1' },
      },
    })
    render(<CashFlowWidget range={range} />)
    // The Shopping group nets -30, so it must not be drawn as a flow at all.
    expect(screen.getByLabelText(/across 0 groups/)).toBeInTheDocument()
  })

  it('shows the empty state when no income is in range and the only expense group nets to zero or less', () => {
    useBudgetStore.setState({
      categoryGroups: { g1: { id: 'g1', name: 'Shopping', kind: 'expense' } },
      categories: { c1: { id: 'c1', groupId: 'g1', name: 'Personal', targetAmount: 0 } },
      transactions: {
        s1: { id: 's1', date: '2026-08-02', amount: 20, description: 'BUY', type: 'expense', categoryId: 'c1' },
        r1: { id: 'r1', date: '2026-08-03', amount: -50, description: 'REFUND', type: 'expense', categoryId: 'c1' },
      },
    })
    render(<CashFlowWidget range={range} />)
    // No income this period and Shopping nets -30, so after filtering there is
    // nothing left to draw. The widget must fall back to its empty state
    // rather than hand Recharts a single unconnected pool node.
    expect(screen.getByText('No transactions this month.')).toBeInTheDocument()
  })

  it('does not draw an expense group that nets to exactly zero', () => {
    useBudgetStore.setState({
      categoryGroups: {
        gi: { id: 'gi', name: 'Income', kind: 'income' },
        g1: { id: 'g1', name: 'Shopping', kind: 'expense' },
      },
      categories: {
        ci: { id: 'ci', groupId: 'gi', name: 'Salary', targetAmount: 0 },
        c1: { id: 'c1', groupId: 'g1', name: 'Personal', targetAmount: 0 },
      },
      transactions: {
        i1: { id: 'i1', date: '2026-08-01', amount: 1000, description: 'PAYROLL', type: 'income', categoryId: 'ci' },
        s1: { id: 's1', date: '2026-08-02', amount: 20, description: 'BUY', type: 'expense', categoryId: 'c1' },
        r1: { id: 'r1', date: '2026-08-03', amount: -20, description: 'REFUND', type: 'expense', categoryId: 'c1' },
      },
    })
    render(<CashFlowWidget range={range} />)
    // Shopping nets to exactly 0 (20 spend fully offset by a -20 refund), so
    // it must be excluded the same way a negative net is.
    expect(screen.getByLabelText(/across 0 groups/)).toBeInTheDocument()
  })
})
