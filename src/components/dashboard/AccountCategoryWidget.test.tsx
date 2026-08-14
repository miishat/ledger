import { render, screen } from '@testing-library/react'
import { AccountCategoryWidget } from './AccountCategoryWidget'
import { useAccountsStore } from '../../store/useAccountsStore'

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
    const remove = screen.getByLabelText('Remove account')
    for (const btn of [edit, remove]) {
      const classes = btn.className.split(/\s+/)
      expect(classes).toContain('min-h-[44px]')
      expect(classes).toContain('min-w-[44px]')
      expect(classes).toContain('sm:min-h-0')
      expect(classes).toContain('sm:min-w-0')
      expect(classes).not.toContain('opacity-0') // bare opacity-0 would hide it on touch
      expect(classes).toContain('sm:opacity-0')
      expect(classes).toContain('sm:group-hover:opacity-100')
    }
  })

  it('truncates long account names so the row cannot break', () => {
    useAccountsStore.setState({
      accounts: [{ id: 'a1', name: 'Joint Savings for the Big 2026 Vacation Fund', value: 1200, type: 'bank' }],
    })
    render(<AccountCategoryWidget title="Bank" type="bank" />)
    const name = screen.getByText(/Joint Savings/)
    expect(name.className.split(/\s+/)).toContain('truncate')
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
