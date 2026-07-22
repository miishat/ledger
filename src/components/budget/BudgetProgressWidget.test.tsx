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

  it('shows the annual spent and left-this-year line without a set-aside clause', () => {
    seed({ spentOnVacation: 250 })
    render(<BudgetProgressWidget range={{ from: '2026-04', to: '2026-04' }} />)
    expect(screen.getByText(/\$250 spent · \$2,150 left this year/)).toBeInTheDocument()
    expect(screen.queryByText(/Set aside/)).not.toBeInTheDocument()
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

  // The exact set-aside figure is no longer shown (that copy was removed); the
  // pace label is the remaining observable, so these use a spend that only reads
  // "on pace" when the expected is anchored to the viewed month ($1,200 for six
  // elapsed months). A wall-clock or full-year anchor would inflate expected and
  // flip the label to "under pace". The set-aside math itself is unit-tested in
  // cadence.test.ts (elapsedMonthsInYear, setAsideExpected).
  it('anchors pace to the viewed month, not the wall clock', () => {
    // Clock is July 2026, but viewing June 2026 (a past month).
    vi.setSystemTime(new Date(2026, 6, 15)) // 15 July 2026, seven months elapsed in real time
    seed({ spentOnVacation: 1150 })
    render(<BudgetProgressWidget range={{ from: '2026-06', to: '2026-06' }} />)
    // Anchored to June: expected 2400*6/12 = $1,200, so $1,150 is on pace.
    // Wall-clock July (seven months) would expect $1,400 and read under pace.
    expect(screen.getByText(/on pace/)).toBeInTheDocument()
    expect(screen.queryByText(/under pace/)).not.toBeInTheDocument()
  })

  it('handles viewing a past year without using current elapsed months', () => {
    // Clock is July 2026, viewing June 2025 (a past year). Spend is dated in
    // 2025 so it falls inside that year's spend window.
    vi.setSystemTime(new Date(2026, 6, 15)) // 15 July 2026
    useBudgetStore.setState({
      categoryGroups: { g1: { id: 'g1', name: 'Travel', kind: 'expense' } },
      categories: { c1: { id: 'c1', groupId: 'g1', name: 'Vacation', targetAmount: 2400, cadence: 'annual' } },
      transactions: {
        t1: { id: 't1', date: '2025-03-10', amount: 1150, categoryId: 'c1', description: 'Flights', type: 'expense' },
      },
      reallocations: {},
    })
    render(<BudgetProgressWidget range={{ from: '2025-06', to: '2025-06' }} />)
    // Anchored to June 2025 (six months): expected $1,200, so $1,150 is on pace.
    // Using the full year (twelve months) would expect $2,400 and read under pace.
    expect(screen.getByText(/on pace/)).toBeInTheDocument()
    expect(screen.queryByText(/under pace/)).not.toBeInTheDocument()
  })
})
