import { render, screen } from '@testing-library/react'
import { NetWorthWidget } from './NetWorthWidget'
import { useAccountsStore } from '../../../store/useAccountsStore'

const initialState = useAccountsStore.getState()

beforeEach(() => {
  useAccountsStore.setState(initialState, true)
})

describe('NetWorthWidget currency formatting', () => {
  it('renders a negative net worth with a leading minus sign', () => {
    useAccountsStore.setState({
      accounts: [{ id: 'd1', name: 'Mortgage', value: 210000, type: 'debt' }],
      history: [],
    })
    render(<NetWorthWidget />)
    expect(screen.getByText('-$210,000.00')).toBeInTheDocument()
  })

  it('renders a positive net worth without a sign', () => {
    useAccountsStore.setState({
      accounts: [{ id: 'b1', name: 'Chequing', value: 15000, type: 'bank' }],
      history: [],
    })
    render(<NetWorthWidget />)
    expect(screen.getByText('$15,000.00')).toBeInTheDocument()
  })
})
