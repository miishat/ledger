import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BudgetHealthWidget } from './BudgetHealthWidget'
import { useBudgetStore } from '../../../store/useBudgetStore'

const budgetInitial = useBudgetStore.getState()

beforeEach(() => {
  useBudgetStore.setState(budgetInitial, true)
})

const renderWidget = () =>
  render(
    <MemoryRouter>
      <BudgetHealthWidget />
    </MemoryRouter>,
  )

describe('BudgetHealthWidget', () => {
  it('points a user with no transactions at the Budgeting page', () => {
    renderWidget()
    expect(screen.getByRole('link', { name: 'Add transactions in Budgeting' })).toHaveAttribute(
      'href',
      '/budget',
    )
  })

  it('shows the remaining figure once transactions exist', () => {
    const month = new Date().toISOString().slice(0, 7)
    useBudgetStore.setState({
      categoryGroups: { g1: { id: 'g1', name: 'Housing', kind: 'expense' } },
      categories: { c1: { id: 'c1', groupId: 'g1', name: 'Rent', targetAmount: 1000 } },
      transactions: {
        t1: { id: 't1', date: `${month}-05`, amount: 400, description: 'Rent', type: 'expense', categoryId: 'c1' },
      },
    })
    renderWidget()
    expect(screen.getByText('$600')).toBeInTheDocument()
    expect(screen.getByText('left of targets · $400 spent')).toBeInTheDocument()
  })
})
