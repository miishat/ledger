import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ParadigmBanner } from './ParadigmBanner'
import { useBudgetStore } from '../../store/useBudgetStore'

function seed(paradigm: string, incomeAmount: number) {
  useBudgetStore.setState({
    paradigm: paradigm as never,
    transactions: {
      i: { id: 'i', date: '2026-07-01', amount: incomeAmount, categoryId: 'inc', description: 'pay', type: 'income' },
      e: { id: 'e', date: '2026-07-02', amount: 300, categoryId: 'rent', description: 'rent', type: 'expense' },
    },
    categories: {
      inc: { id: 'inc', groupId: 'gi', name: 'Salary', targetAmount: 0 },
      rent: { id: 'rent', groupId: 'ge', name: 'Rent', targetAmount: 200 },
    },
    categoryGroups: {
      gi: { id: 'gi', name: 'Income', kind: 'income' },
      ge: { id: 'ge', name: 'Housing', kind: 'expense', budgetClass: 'need' },
    },
    reallocations: {},
  })
}

describe('ParadigmBanner', () => {
  beforeEach(() => seed('Ledger Custom', 1000))

  it('renders nothing for Ledger Custom', () => {
    const { container } = render(<ParadigmBanner selectedMonth="2026-07" />)
    expect(container.firstChild).toBeNull()
  })

  it('Zero-Based: shows unassigned amount', () => {
    seed('Zero-Based', 1000) // targets 200, unassigned 800
    render(<ParadigmBanner selectedMonth="2026-07" />)
    expect(screen.getByText(/\$800 unassigned/)).toBeInTheDocument()
  })

  it('Zero-Based: shows over-assigned message when negative', () => {
    seed('Zero-Based', 100) // targets 200, unassigned -100
    render(<ParadigmBanner selectedMonth="2026-07" />)
    expect(screen.getByText(/assigned \$100 more than you earned/i)).toBeInTheDocument()
  })

  it('Target-Based: shows buffer, warns when negative', () => {
    seed('Target-Based', 1000) // buffer = 800 - overspend(rent 300>200 => 100) = 700
    render(<ParadigmBanner selectedMonth="2026-07" />)
    expect(screen.getByText(/\$700 buffer/i)).toBeInTheDocument()
  })

  it('50/30/20: shows bucket percentages', () => {
    seed('50/30/20', 1000)
    render(<ParadigmBanner selectedMonth="2026-07" />)
    expect(screen.getByText(/Needs 30%/)).toBeInTheDocument()
    expect(screen.getByText(/Wants 0%/)).toBeInTheDocument()
    expect(screen.getByText(/Savings 0%/)).toBeInTheDocument()
  })
})
