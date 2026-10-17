import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BudgetOverviewMobile } from './BudgetOverviewMobile'
import { useBudgetStore } from '../../store/useBudgetStore'
import { setMatchMedia, resetMatchMedia } from '../../test-utils/matchMedia'

const initial = useBudgetStore.getState()
const range = { from: '2026-08', to: '2026-08' }

beforeEach(() => {
  setMatchMedia(false)
  useBudgetStore.setState(initial, true)
  useBudgetStore.setState({
    categoryGroups: { g1: { id: 'g1', name: 'Housing' }, g2: { id: 'g2', name: 'Food' } },
    categories: {
      rent: { id: 'rent', groupId: 'g1', name: 'Rent', targetAmount: 1000 },
      food: { id: 'food', groupId: 'g2', name: 'Groceries', targetAmount: 500 },
      pay: { id: 'pay', groupId: 'g1', name: 'Salary', targetAmount: 0 },
    },
    transactions: {
      i1: { id: 'i1', date: '2026-08-02', amount: 4000, description: 'Pay', type: 'income', categoryId: 'pay' },
      e1: { id: 'e1', date: '2026-08-03', amount: 1200, description: 'Rent', type: 'expense', categoryId: 'rent' },
      e2: { id: 'e2', date: '2026-08-04', amount: 300, description: 'Food', type: 'expense', categoryId: 'food' },
    },
  } as never)
})
afterEach(() => resetMatchMedia())

const renderIt = () => render(<MemoryRouter><BudgetOverviewMobile range={range} /></MemoryRouter>)

describe('BudgetOverviewMobile', () => {
  it('opens on the Spending donut with the total and each group share', () => {
    renderIt()
    const card = screen.getByRole('region', { name: 'Spending' })
    expect(within(card).getByText('$1,500')).toBeInTheDocument()
    expect(within(card).getByText('Housing')).toBeInTheDocument()
    expect(within(card).getByText('80%')).toBeInTheDocument()
    expect(within(card).getByText('Food')).toBeInTheDocument()
    expect(within(card).getByText('20%')).toBeInTheDocument()
  })

  it('puts the Spending and Income switch under the chart and switches the donut to income', () => {
    renderIt()
    const card = screen.getByRole('region', { name: 'Spending' })
    const group = within(card).getByRole('group', { name: 'Chart shows' })
    expect(card.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_CONTAINED_BY).toBeTruthy()
    expect(within(card).getByText('Out').compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(group).getByRole('button', { name: 'Spending' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(group).getByRole('button', { name: 'Income' }))
    const income = screen.getByRole('region', { name: 'Income' })
    expect(within(income).getByText('$4,000')).toBeInTheDocument()
    expect(within(income).getByText('Salary')).toBeInTheDocument()
    expect(within(income).getByText('100%')).toBeInTheDocument()
  })

  it('shows In, Net and Saved', () => {
    renderIt()
    const card = screen.getByRole('region', { name: 'Net Change' })
    expect(within(card).getByText('$4,000')).toBeInTheDocument()
    expect(within(card).getByText('+$2,500')).toBeInTheDocument()
    expect(within(card).getByText('63%')).toBeInTheDocument()
  })

  it('lists each budgeted category against its target', () => {
    renderIt()
    const card = screen.getByRole('region', { name: 'Budget vs. Actual' })
    expect(within(card).getByText('$1,200 / $1,000')).toBeInTheDocument()
    expect(within(card).getByText('$300 / $500')).toBeInTheDocument()
  })

  it('keeps income sources in a fold and says so when a period has none', () => {
    useBudgetStore.setState({ transactions: {} } as never)
    renderIt()
    expect(screen.getByText('No spending in this period yet.')).toBeInTheDocument()
    expect(screen.getByText('No income in this period yet.')).toBeInTheDocument()
  })
})
