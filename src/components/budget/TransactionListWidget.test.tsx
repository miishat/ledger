import { render, screen, within, fireEvent } from '@testing-library/react'
import { TransactionListWidget } from './TransactionListWidget'
import { useBudgetStore } from '../../store/useBudgetStore'
import { useUndoStore } from '../../store/useUndoStore'
import type { Transaction } from '../../types/budget'

const initialState = useBudgetStore.getState()

beforeEach(() => {
  useBudgetStore.setState(initialState, true)
  useUndoStore.setState({ pending: null })
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

  it('states the full transaction count in the Clear All confirmation, not the filtered count', () => {
    seedThree()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    fireEvent.change(screen.getByLabelText('Search transactions'), { target: { value: 'netfl' } })
    fireEvent.click(screen.getByTitle('Clear All Transactions'))
    expect(screen.getByText(/Every transaction \(3\) will be deleted/)).toBeInTheDocument()
    expect(screen.getByText(/hidden by the current search or filter/)).toBeInTheDocument()
  })

  it('replaces the row-delete undo offer with the Clear All undo offer', () => {
    seedThree()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    fireEvent.click(screen.getAllByLabelText('Delete transaction')[0])
    expect(useUndoStore.getState().pending?.label).toMatch(/^Deleted "/)
    fireEvent.click(screen.getByTitle('Clear All Transactions'))
    const confirmButtons = screen.getAllByRole('button', { name: 'Clear All' })
    fireEvent.click(confirmButtons[confirmButtons.length - 1])
    expect(useUndoStore.getState().pending?.label).toMatch(/^Cleared /)
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

describe('TransactionListWidget undo', () => {
  const seedOne = () => {
    useBudgetStore.setState({
      transactions: {
        t1: { id: 't1', date: '2026-07-03', amount: 42, description: 'Coffee Bar', type: 'expense' },
      },
    })
  }

  it('restores a single deleted transaction, with its fields intact', () => {
    seedOne()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    const table = screen.getByRole('table')
    fireEvent.click(within(table).getByLabelText('Delete transaction'))
    expect(useBudgetStore.getState().transactions.t1).toBeUndefined()

    useUndoStore.getState().runUndo()
    expect(useBudgetStore.getState().transactions.t1).toEqual({
      id: 't1',
      date: '2026-07-03',
      amount: 42,
      description: 'Coffee Bar',
      type: 'expense',
    })
  })

  it('names what was deleted', () => {
    seedOne()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    const table = screen.getByRole('table')
    fireEvent.click(within(table).getByLabelText('Delete transaction'))
    expect(useUndoStore.getState().pending?.label).toBe('Deleted "Coffee Bar"')
  })

  it('drops the offer once dismissed', () => {
    seedOne()
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    const table = screen.getByRole('table')
    fireEvent.click(within(table).getByLabelText('Delete transaction'))
    useUndoStore.getState().dismissUndo()
    expect(useUndoStore.getState().pending).toBeNull()
    expect(useBudgetStore.getState().transactions.t1).toBeUndefined()
  })

  it('restores every row from a bulk delete', () => {
    useBudgetStore.setState({
      transactions: {
        t1: { id: 't1', date: '2026-07-03', amount: 42, description: 'Coffee Bar', type: 'expense' },
        t2: { id: 't2', date: '2026-07-04', amount: 9, description: 'Netflix', type: 'expense' },
      },
    })
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    fireEvent.click(screen.getByLabelText('Select all transactions'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(Object.keys(useBudgetStore.getState().transactions)).toHaveLength(0)

    useUndoStore.getState().runUndo()
    expect(Object.keys(useBudgetStore.getState().transactions).sort()).toEqual(['t1', 't2'])
  })

  it('does not delete selected rows that the search has filtered out', () => {
    useBudgetStore.setState({
      transactions: {
        t1: { id: 't1', date: '2026-07-03', amount: 42, description: 'Coffee Bar', type: 'expense' },
        t2: { id: 't2', date: '2026-07-04', amount: 9, description: 'Netflix', type: 'expense' },
        t3: { id: 't3', date: '2026-07-05', amount: 15, description: 'Groceries', type: 'expense' },
      },
    })
    render(<TransactionListWidget range={{ from: '2026-07', to: '2026-07' }} />)
    fireEvent.click(screen.getByLabelText('Select all transactions'))
    fireEvent.change(screen.getByLabelText('Search transactions'), { target: { value: 'Groceries' } })
    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    const remaining = useBudgetStore.getState().transactions
    expect(remaining.t3).toBeUndefined()
    expect(remaining.t1).toBeDefined()
    expect(remaining.t2).toBeDefined()
  })
})

describe('TransactionListWidget splits and tags', () => {
  const split = {
    id: 'tx1',
    date: '2026-08-04',
    amount: 180,
    description: 'Costco',
    type: 'expense' as const,
    categoryId: 'groceries',
    splits: [
      { categoryId: 'groceries', amount: 120 },
      { categoryId: 'household', amount: 60 },
    ],
    tags: ['trip'],
    note: 'weekly shop',
  }

  it('labels a split row with the number of slices instead of one category', () => {
    useBudgetStore.setState({
      categories: {
        groceries: { id: 'groceries', groupId: 'g1', name: 'Groceries', targetAmount: 0 },
        household: { id: 'household', groupId: 'g1', name: 'Household', targetAmount: 0 },
      },
      transactions: { tx1: split },
    })
    render(<TransactionListWidget range={{ from: '2026-08', to: '2026-08' }} />)
    const table = screen.getByRole('table')
    expect(within(table).getByText('Split · 2')).toBeInTheDocument()
  })

  it('finds a transaction by tag', () => {
    useBudgetStore.setState({
      categories: { groceries: { id: 'groceries', groupId: 'g1', name: 'Groceries', targetAmount: 0 } },
      transactions: {
        tx1: split,
        tx2: { id: 'tx2', date: '2026-08-05', amount: 9, description: 'Coffee', type: 'expense' as const },
      },
    })
    render(<TransactionListWidget range={{ from: '2026-08', to: '2026-08' }} />)
    fireEvent.change(screen.getByLabelText('Search transactions'), { target: { value: 'trip' } })
    const table = screen.getByRole('table')
    expect(within(table).getByText('Costco')).toBeInTheDocument()
    expect(within(table).queryByText('Coffee')).toBeNull()
  })

  it('finds a transaction by note text', () => {
    useBudgetStore.setState({
      categories: {},
      transactions: { tx1: split },
    })
    render(<TransactionListWidget range={{ from: '2026-08', to: '2026-08' }} />)
    fireEvent.change(screen.getByLabelText('Search transactions'), { target: { value: 'weekly' } })
    expect(within(screen.getByRole('table')).getByText('Costco')).toBeInTheDocument()
  })
})

describe('undo via the global store', () => {
  beforeEach(() => {
    useUndoStore.setState({ pending: null })
  })

  it('offers an undo through the undo store when a row is deleted', () => {
    useBudgetStore.setState({
      categories: {},
      transactions: { tx1: { id: 'tx1', date: '2026-08-03', amount: 42, description: 'Coffee', type: 'expense' } },
    })
    render(<TransactionListWidget range={{ from: '2026-08', to: '2026-08' }} />)
    fireEvent.click(within(screen.getByRole('table')).getByLabelText('Delete transaction'))

    expect(useBudgetStore.getState().transactions).toEqual({})
    expect(useUndoStore.getState().pending?.label).toBe('Deleted "Coffee"')

    useUndoStore.getState().runUndo()
    expect(useBudgetStore.getState().transactions.tx1.description).toBe('Coffee')
  })

  it('offers an undo after Clear All that restores every transaction', () => {
    useBudgetStore.setState({
      categories: {},
      transactions: {
        tx1: { id: 'tx1', date: '2026-08-03', amount: 42, description: 'Coffee', type: 'expense' },
        tx2: { id: 'tx2', date: '2026-08-04', amount: 10, description: 'Tea', type: 'expense' },
      },
    })
    render(<TransactionListWidget range={{ from: '2026-08', to: '2026-08' }} />)
    fireEvent.click(screen.getByTitle('Clear All Transactions'))
    const confirmButtons = screen.getAllByRole('button', { name: 'Clear All' })
    fireEvent.click(confirmButtons[confirmButtons.length - 1])

    expect(useBudgetStore.getState().transactions).toEqual({})
    expect(useUndoStore.getState().pending?.label).toBe('Cleared 2 transactions')

    useUndoStore.getState().runUndo()
    expect(Object.keys(useBudgetStore.getState().transactions).sort()).toEqual(['tx1', 'tx2'])
  })
})

describe('TransactionListWidget keyboard access', () => {
  it('opens a row for editing with Enter and with Space', () => {
    useBudgetStore.setState({
      transactions: {
        a1: { id: 'a1', date: '2026-08-04', amount: 20, description: 'KEYBOARD ROW', type: 'expense' },
      },
      categories: {},
    })
    render(<TransactionListWidget range={{ from: '2026-08', to: '2026-08' }} />)

    const row = screen.getByRole('button', { name: /KEYBOARD ROW/ })
    expect(row).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(row, { key: 'Enter' })
    expect(screen.getByTestId('sheet-panel')).toBeInTheDocument()
  })
})

describe('TransactionListWidget selection at scale', () => {
  it(
    'keeps selection scoped to visible rows when the search narrows',
    async () => {
      const transactions: Record<string, Transaction> = {}
      for (let i = 0; i < 600; i++) {
        transactions[`t${i}`] = {
          id: `t${i}`,
          date: '2026-08-04',
          amount: 10,
          description: i < 100 ? `COFFEE ${i}` : `GROCERY ${i}`,
          type: 'expense',
        }
      }
      useBudgetStore.setState({ transactions, categories: {} })

      render(<TransactionListWidget range={{ from: '2026-08', to: '2026-08' }} />)

      fireEvent.click(screen.getByLabelText('Select all transactions'))
      expect(screen.getByText('600 selected')).toBeInTheDocument()

      fireEvent.change(screen.getByLabelText('Search transactions'), { target: { value: 'COFFEE' } })
      expect(screen.getByText('100 selected')).toBeInTheDocument()
    },
    30000
  )
})
