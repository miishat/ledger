import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllocationBars } from './AllocationBars'
import type { Holding } from '../../store/usePortfolioStore'

const h = (over: Partial<Holding>): Holding => ({
  id: 'h1', ticker: 'AAA', quantity: 1, avgCost: 100, currency: 'CAD', account: 'RRSP', ...over,
})

const rows = [
  { holding: h({ id: '1', ticker: 'ENB', account: 'RRSP' }), price: 100 },
  { holding: h({ id: '2', ticker: 'AAPL', currency: 'USD' as const, account: 'TFSA' }), price: 100 },
]

describe('AllocationBars', () => {
  it('shows all three cuts at once, with no toggle', () => {
    render(<AllocationBars rows={rows} rates={{ USD: 1.37 }} />)
    expect(screen.getByText('Holding')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('Currency')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^By / })).not.toBeInTheDocument()
  })

  it('names every segment in text, not only in colour', () => {
    render(<AllocationBars rows={rows} rates={{ USD: 1.37 }} />)
    for (const name of ['ENB', 'AAPL', 'RRSP', 'TFSA', 'CAD', 'USD']) {
      expect(screen.getByText(new RegExp(`${name} \\d`))).toBeInTheDocument()
    }
  })

  it('gives each bar an accessible name carrying its breakdown', () => {
    render(<AllocationBars rows={rows} rates={{ USD: 1.37 }} />)
    expect(screen.getByRole('img', { name: /Allocation by holding/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Allocation by account/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Allocation by currency/ })).toBeInTheDocument()
  })

  it('renders nothing with no rows', () => {
    const { container } = render(<AllocationBars rows={[]} rates={{}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
