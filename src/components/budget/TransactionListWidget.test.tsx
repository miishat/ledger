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
