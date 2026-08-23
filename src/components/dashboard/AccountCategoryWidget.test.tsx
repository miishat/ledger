import { fireEvent, render, screen } from '@testing-library/react'
import { AccountCategoryWidget } from './AccountCategoryWidget'
import { useAccountsStore } from '../../store/useAccountsStore'
import { useUndoStore } from '../../store/useUndoStore'

const initialState = useAccountsStore.getState()

beforeEach(() => {
  useAccountsStore.setState(initialState, true)
})

describe('AccountCategoryWidget mobile tap targets', () => {
  it('renders touch-visible edit/remove buttons with >=44px hit areas', () => {
    useAccountsStore.setState({
      accounts: [{ id: 'a1', name: 'Chequing', value: 1200, type: 'bank' }],
    })
    render(<AccountCategoryWidget title="Bank" type="bank" />)
    const edit = screen.getByLabelText('Edit account')
    const remove = screen.getByLabelText('Delete Chequing')
    for (const btn of [edit, remove]) {
      const classes = btn.className.split(/\s+/)
      expect(classes).toContain('min-h-[44px]')
      expect(classes).toContain('min-w-[44px]')
      expect(classes).toContain('sm:min-h-0')
      expect(classes).toContain('sm:min-w-0')
      expect(classes).not.toContain('opacity-0') // bare opacity-0 would hide it on touch
      expect(classes).not.toContain('sm:opacity-0') // width is the wrong gate, hover capability is the right one
      expect(classes).toContain('reveal-on-hover')
    }
  })

  it('lets a long account name wrap rather than truncate, at every width', () => {
    // Truncation was safe only while the row had room. On a 2-column tablet
    // grid the name column measured 11px, so `truncate` cut every name to one
    // or two characters.
    useAccountsStore.setState({
      accounts: [{ id: 'a1', name: 'Joint Savings for the Big 2026 Vacation Fund', value: 1200, type: 'bank' }],
    })
    render(<AccountCategoryWidget title="Bank" type="bank" />)
    const name = screen.getByText(/Joint Savings/)
    const classes = name.className.split(/\s+/)
    expect(classes).toContain('break-words')
    expect(classes).toContain('flex-1')
    expect(classes).toContain('min-w-0')
    expect(classes).not.toContain('truncate')
    expect(classes).not.toContain('desktop:truncate')
  })

  it('gives the name a width floor so the row can fall back to a stacked layout on a narrow desktop card', () => {
    // On the narrowest single-column tablet card the value block (amount plus
    // two icon buttons) is nearly the whole row width by itself. Without a
    // floor, flex-1/min-w-0 alone still let the name get squeezed to 0
    // instead of wrapping the row to a second line.
    useAccountsStore.setState({
      accounts: [{ id: 'a1', name: 'Mortgage - 12 Maplewood Crescent', value: 412500, type: 'debt' }],
    })
    const { container } = render(<AccountCategoryWidget title="Debts & Liabilities" type="debt" />)
    const row = container.querySelector('[data-testid="account-row-a1"]')!
    const name = container.querySelector('[data-testid="account-name-a1"]')!
    expect(row.className).toMatch(/desktop:flex-wrap/)
    expect(name.className).toMatch(/desktop:min-w-\[70px\]/)
  })
})

describe('AccountCategoryWidget mobile name layout', () => {
  it('stacks a long account name above its value on mobile so it does not truncate', () => {
    // The name column measured 111px while "Mortgage - 12 Maplewood Crescent"
    // needs 220px, so the name was cut mid-word on every phone.
    useAccountsStore.setState({
      accounts: [{ id: 'a1', name: 'Mortgage - 12 Maplewood Crescent', value: 412000, type: 'debt' }],
    })
    const { container } = render(<AccountCategoryWidget title="Debts & Liabilities" type="debt" />)
    const row = container.querySelector('[data-testid="account-row-a1"]')!
    expect(row).not.toBeNull()
    expect(row.className).toMatch(/flex-col/)
    expect(row.className).toMatch(/desktop:flex-row/)
  })
})

describe('AccountCategoryWidget empty state', () => {
  it('invites the user to add their first account instead of showing a bare sentence', () => {
    useAccountsStore.setState({ accounts: [] })
    render(<AccountCategoryWidget title="Bank Accounts" type="bank" />)
    expect(screen.getByText('No accounts yet')).toBeInTheDocument()
    const cta = screen.getByRole('button', { name: 'Add account' })
    expect(cta).toBeInTheDocument()
  })

  it('uses an explicit singular noun for the debt widget instead of a mangled title', () => {
    useAccountsStore.setState({ accounts: [] })
    render(<AccountCategoryWidget title="Debts & Liabilities" type="debt" />)
    expect(screen.getByText('Add your first debt to start tracking.')).toBeInTheDocument()
  })
})

describe('AccountCategoryWidget account delete undo', () => {
  it('offers an undo that restores a deleted account with its value', () => {
    useUndoStore.setState({ pending: null })
    useAccountsStore.setState({
      accounts: [{ id: 'a1', name: 'Chequing', value: 2500, type: 'bank' }],
      history: [],
    })
    render(<AccountCategoryWidget title="Bank Accounts" type="bank" />)
    fireEvent.click(screen.getByLabelText('Delete Chequing'))

    expect(useAccountsStore.getState().accounts).toEqual([])
    expect(useUndoStore.getState().pending?.label).toBe('Deleted account "Chequing"')

    useUndoStore.getState().runUndo()
    const restored = useAccountsStore.getState().accounts
    expect(restored).toHaveLength(1)
    expect(restored[0].name).toBe('Chequing')
    expect(restored[0].value).toBe(2500)
  })
})
