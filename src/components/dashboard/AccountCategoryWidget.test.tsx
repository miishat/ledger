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
