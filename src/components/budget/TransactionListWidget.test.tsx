import { render, screen, within, fireEvent } from '@testing-library/react'
import { TransactionListWidget } from './TransactionListWidget'
import { useBudgetStore } from '../../store/useBudgetStore'

const initialState = useBudgetStore.getState()

beforeEach(() => {
  useBudgetStore.setState(initialState, true)
})

describe('TransactionListWidget mobile layout', () => {
  it('lets the header row wrap instead of overflowing the card', () => {
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
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
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    const table = screen.getByRole('table')
    const del = within(table).getByLabelText('Delete transaction')
    const classes = del.className.split(/\s+/)
    expect(classes).not.toContain('opacity-0') // bare opacity-0 would hide it on touch
    expect(classes).toContain('sm:opacity-0')
    expect(classes).toContain('sm:group-hover:opacity-100')
  })

  it('renders a mobile card list alongside the desktop table with matching values and reachable actions', () => {
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
    const { container } = render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)

    const cards = container.querySelector('[data-testid="transactions-cards"]')
    expect(cards).not.toBeNull()
    expect(cards?.textContent).toContain('Coffee')
    expect(cards?.textContent).toContain('$42')

    const cardScope = within(cards as HTMLElement)
    const deleteBtn = cardScope.getByLabelText('Delete transaction')
    expect(deleteBtn).toBeVisible()

    // ≥44px tap target: padding classes that yield at least a 44x44 box around the icon
    const delClasses = deleteBtn.className.split(/\s+/)
    expect(delClasses.some((c) => /^p-(3|3\.5|4)$/.test(c))).toBe(true)

    // Edit remains reachable: clicking the card (outside the delete button) opens the edit modal
    const editTrigger = cardScope.getByTestId('transaction-card-tx1')
    fireEvent.click(editTrigger)
    expect(screen.getByDisplayValue('Coffee')).toBeInTheDocument()
  })
})

describe('TransactionListWidget search', () => {
  const seedThree = () => {
    useBudgetStore.setState({
      categories: {
        c1: { id: 'c1', groupId: 'g1', name: 'Groceries', targetAmount: 0 },
      },
      transactions: {
        t1: { id: 't1', date: '2026-07-03', amount: 42, description: 'Coffee Bar', type: 'expense' },
        t2: { id: 't2', date: '2026-07-04', amount: 9, description: 'Netflix', type: 'expense' },
        t3: { id: 't3', date: '2026-07-05', amount: 80, description: 'Loblaws', type: 'expense', categoryId: 'c1' },
      },
    })
  }

  it('filters by description, case insensitively', () => {
    seedThree()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    fireEvent.change(screen.getByLabelText('Search transactions'), { target: { value: 'netfl' } })
    const table = screen.getByRole('table')
    expect(within(table).getByText('Netflix')).toBeInTheDocument()
    expect(within(table).queryByText('Coffee Bar')).not.toBeInTheDocument()
  })

  it('matches on the category name too', () => {
    seedThree()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    fireEvent.change(screen.getByLabelText('Search transactions'), { target: { value: 'grocer' } })
    const table = screen.getByRole('table')
    expect(within(table).getByText('Loblaws')).toBeInTheDocument()
    expect(within(table).queryByText('Netflix')).not.toBeInTheDocument()
  })

  it('says so when nothing matches instead of showing an empty table', () => {
    seedThree()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    fireEvent.change(screen.getByLabelText('Search transactions'), { target: { value: 'zzzz' } })
    expect(screen.getByText('No matching transactions')).toBeInTheDocument()
  })
})

describe('TransactionListWidget bulk actions', () => {
  const seedTwo = () => {
    useBudgetStore.setState({
      categories: {
        c1: { id: 'c1', groupId: 'g1', name: 'Groceries', targetAmount: 0 },
      },
      categoryGroups: { g1: { id: 'g1', name: 'Food', kind: 'expense' } },
      transactions: {
        t1: { id: 't1', date: '2026-07-03', amount: 42, description: 'Coffee Bar', type: 'expense' },
        t2: { id: 't2', date: '2026-07-04', amount: 9, description: 'Netflix', type: 'expense' },
      },
    })
  }

  it('shows how many rows are selected once one is ticked', () => {
    seedTwo()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    const table = screen.getByRole('table')
    fireEvent.click(within(table).getAllByLabelText('Select transaction')[0])
    expect(screen.getByText('1 selected')).toBeInTheDocument()
  })

  it('selects and clears every visible row from the header checkbox', () => {
    seedTwo()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    const selectAll = screen.getByLabelText('Select all transactions')
    fireEvent.click(selectAll)
    expect(screen.getByText('2 selected')).toBeInTheDocument()
    fireEvent.click(selectAll)
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument()
  })

  // ThemedSelect is a custom listbox, not a native <select>: open the trigger by
  // its aria-label, then click the option. fireEvent.change does nothing here.
  it('applies a category to every selected row', () => {
    seedTwo()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    fireEvent.click(screen.getByLabelText('Select all transactions'))
    fireEvent.click(screen.getByLabelText('Category for selected'))
    fireEvent.click(screen.getByRole('option', { name: 'Groceries' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    const txs = useBudgetStore.getState().transactions
    expect(txs.t1.categoryId).toBe('c1')
    expect(txs.t2.categoryId).toBe('c1')
  })

  it('deletes the selected rows only after the confirmation is accepted', () => {
    seedTwo()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    const table = screen.getByRole('table')
    fireEvent.click(within(table).getAllByLabelText('Select transaction')[0])
    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }))
    expect(Object.keys(useBudgetStore.getState().transactions)).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(Object.keys(useBudgetStore.getState().transactions)).toHaveLength(1)
  })

  it('does not open the edit modal when the row checkbox is clicked', () => {
    seedTwo()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    const table = screen.getByRole('table')
    fireEvent.click(within(table).getAllByLabelText('Select transaction')[0])
    expect(screen.queryByDisplayValue('Netflix')).not.toBeInTheDocument()
  })
})
