import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MonthlySummaryWidget } from './MonthlySummaryWidget'
import { useBudgetStore } from '../../store/useBudgetStore'

const budgetInitial = useBudgetStore.getState()

beforeEach(() => {
  useBudgetStore.setState(budgetInitial, true)
})

describe('MonthlySummaryWidget', () => {
  it('shows a Projected Net row matching the summary row style', () => {
    const month = new Date().toISOString().slice(0, 7)
    render(<MonthlySummaryWidget range={{ from: month, to: month }} />)
    expect(screen.getByText('Projected Net')).toBeTruthy()
  })
})

describe('MonthlySummaryWidget forecast tooltip', () => {
  it('lists a pending recurring expense with a single minus sign, not a double one', () => {
    // detectRecurring only accepts a positive median amount (amtMed <= 0 is
    // rejected), so a pending forecast row can never carry a negative
    // amount in practice, and this test cannot go red against the old code:
    // for a positive amount, formatMoney(-p.amount) and the old '-' +
    // formatMoney(p.amount) render identically. It is a pure regression
    // guard, confirming the tooltip line touched by this task still renders
    // an ordinary recurring expense with one minus sign after the rewrite.
    const today = new Date()
    const isoDate = (d: Date) => d.toISOString().slice(0, 10)
    const daysAgo = (n: number) => {
      const d = new Date(today)
      d.setDate(d.getDate() - n)
      return isoDate(d)
    }
    useBudgetStore.setState({
      transactions: {
        a: { id: 'a', date: daysAgo(20), amount: 39.99, description: 'AMAZON MKTPLACE PMTS', type: 'expense' },
        b: { id: 'b', date: daysAgo(13), amount: 39.99, description: 'AMAZON MKTPLACE PMTS', type: 'expense' },
        c: { id: 'c', date: daysAgo(6), amount: 39.99, description: 'AMAZON MKTPLACE PMTS', type: 'expense' },
      },
    })
    const month = isoDate(today).slice(0, 7)
    render(<MonthlySummaryWidget range={{ from: month, to: month }} />)
    const tooltip = screen.getByText('Projected Net').closest('[title]')?.getAttribute('title') ?? ''
    expect(tooltip).not.toContain('--')
    expect(tooltip).toContain('-$40')
  })
})
