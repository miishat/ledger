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

describe('NetWorthWidget trend formatting', () => {
  // A month-over-month ratio is an arbitrary float, so it has to be rounded
  // before display or it renders its full binary expansion.
  const seedTrend = (past: number, currentValue: number) => {
    const now = new Date()
    const endOfLastMonth = new Date(new Date(now.getFullYear(), now.getMonth(), 1).getTime() - 1)
    useAccountsStore.setState({
      accounts: [{ id: 'b1', name: 'Chequing', value: currentValue, type: 'bank' }],
      history: [{ date: endOfLastMonth.toISOString().split('T')[0], value: past }],
    })
  }

  it('rounds a repeating trend to two decimals instead of printing the raw float', () => {
    seedTrend(319430.77, 318930.77)
    render(<NetWorthWidget />)
    expect(screen.getByText('-0.16%')).toBeInTheDocument()
    expect(screen.queryByText(/\d\.\d{4,}%/)).not.toBeInTheDocument()
  })

  it('keeps two decimals and a plus sign on a positive trend', () => {
    seedTrend(100000, 110000)
    render(<NetWorthWidget />)
    expect(screen.getByText('+10.00%')).toBeInTheDocument()
  })

  it('does not claim a change when there is no prior month to compare to', () => {
    useAccountsStore.setState({ accounts: [], history: [] })
    render(<NetWorthWidget />)
    expect(screen.getByText('No comparison for last month yet')).toBeInTheDocument()
    expect(screen.queryByText('+0.00%')).not.toBeInTheDocument()
  })
})
