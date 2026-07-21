import { render, screen } from '@testing-library/react'
import { BudgetProgressWidget } from './BudgetProgressWidget'
import { useBudgetStore } from '../../store/useBudgetStore'

const seed = (opts: { spentOnVacation: number }) => {
  useBudgetStore.setState({
    categoryGroups: { g1: { id: 'g1', name: 'Travel', kind: 'expense' } },
    categories: {
      c1: { id: 'c1', groupId: 'g1', name: 'Vacation', targetAmount: 2400, cadence: 'annual' },
      c2: { id: 'c2', groupId: 'g1', name: 'Rent', targetAmount: 1000 },
    },
    transactions: {
      t1: {
        id: 't1', date: '2026-02-10', amount: opts.spentOnVacation,
        categoryId: 'c1', description: 'Flights', type: 'expense',
      },
    },
    reallocations: {},
  })
}

describe('BudgetProgressWidget annual section', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 15)) // 15 April 2026, four months elapsed
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders an annual category against its yearly target, not a monthly one', () => {
    seed({ spentOnVacation: 250 })
    render(<BudgetProgressWidget range={{ from: '2026-04', to: '2026-04' }} />)
    expect(screen.getByText('Annual budgets')).toBeInTheDocument()
    expect(screen.getByText(/\$250 \/ \$2,400/)).toBeInTheDocument()
  })

  it('shows the set-aside pace line', () => {
    seed({ spentOnVacation: 250 })
    render(<BudgetProgressWidget range={{ from: '2026-04', to: '2026-04' }} />)
    expect(screen.getByText(/Set aside \$800 by now/)).toBeInTheDocument()
    expect(screen.getByText(/\$2,150 left this year/)).toBeInTheDocument()
  })

  it('flags an annual category that is ahead of its set-aside pace', () => {
    seed({ spentOnVacation: 1500 })
    render(<BudgetProgressWidget range={{ from: '2026-04', to: '2026-04' }} />)
    expect(screen.getByText(/over pace/)).toBeInTheDocument()
  })

  it('omits the annual section entirely when no annual categories exist', () => {
    useBudgetStore.setState({
      categoryGroups: { g1: { id: 'g1', name: 'Travel', kind: 'expense' } },
      categories: { c2: { id: 'c2', groupId: 'g1', name: 'Rent', targetAmount: 1000 } },
      transactions: {},
      reallocations: {},
    })
    render(<BudgetProgressWidget range={{ from: '2026-04', to: '2026-04' }} />)
    expect(screen.queryByText('Annual budgets')).not.toBeInTheDocument()
  })

  it('keeps annual categories out of the monthly bar list', () => {
    seed({ spentOnVacation: 250 })
    render(<BudgetProgressWidget range={{ from: '2026-04', to: '2026-04' }} />)
    // Vacation appears once, in the annual section, not among the monthly bars.
    expect(screen.getAllByText('Vacation')).toHaveLength(1)
  })
})
