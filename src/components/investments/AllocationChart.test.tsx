import { render, screen, fireEvent } from '@testing-library/react'
import { AllocationChart } from './AllocationChart'
import type { Holding } from '../../store/usePortfolioStore'

const h = (over: Partial<Holding>): Holding => ({
  id: 'h1', ticker: 'AAA', quantity: 1, avgCost: 100, currency: 'CAD', account: 'RRSP', ...over,
})

const rows = [
  { holding: h({ id: '1', ticker: 'ENB', account: 'RRSP' }), price: 100 },
  { holding: h({ id: '2', ticker: 'AAPL', currency: 'USD', account: 'TFSA' }), price: 100 },
]

describe('AllocationChart', () => {
  it('lists holdings by default', () => {
    render(<AllocationChart rows={rows} rates={{ USD: 1.37 }} />)
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('ENB')).toBeInTheDocument()
  })

  it('regroups by account', () => {
    render(<AllocationChart rows={rows} rates={{ USD: 1.37 }} />)
    fireEvent.click(screen.getByRole('button', { name: 'By account' }))
    expect(screen.getByText('TFSA')).toBeInTheDocument()
    expect(screen.getByText('RRSP')).toBeInTheDocument()
  })

  it('regroups by currency', () => {
    render(<AllocationChart rows={rows} rates={{ USD: 1.37 }} />)
    fireEvent.click(screen.getByRole('button', { name: 'By currency' }))
    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('CAD')).toBeInTheDocument()
  })

  it('renders nothing with no rows', () => {
    const { container } = render(<AllocationChart rows={[]} rates={{}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
