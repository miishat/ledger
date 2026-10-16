import { fireEvent, render, screen, within } from '@testing-library/react'
import { BudgetSetupMobile } from './BudgetSetupMobile'
import { useBudgetStore } from '../../store/useBudgetStore'

const initial = useBudgetStore.getState()

beforeEach(() => {
  useBudgetStore.setState(initial, true)
  useBudgetStore.setState({
    categoryGroups: { g1: { id: 'g1', name: 'Food', kind: 'expense' }, g2: { id: 'g2', name: 'Empty', kind: 'expense' } },
    categories: { c1: { id: 'c1', groupId: 'g1', name: 'Groceries', targetAmount: 300 } },
    transactions: {},
    reallocations: {},
  })
})

const open = (name: 'Targets' | 'Categories' | 'Rules') => {
  render(<BudgetSetupMobile selectedMonth="2026-10" />)
  fireEvent.click(screen.getByRole('tab', { name }))
}
const type = (label: string, value: string) => {
  const input = screen.getByLabelText(label)
  fireEvent.change(input, { target: { value } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('BudgetSetupMobile', () => {
  it('shows targets by default with the paradigm and total', () => {
    render(<BudgetSetupMobile selectedMonth="2026-10" />)
    expect(screen.getByRole('tab', { name: 'Targets' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText(/Total Monthly Budget/)).toBeInTheDocument()
  })

  it('adds a category from the group card', () => {
    open('Categories')
    const card = screen.getByText('Food').closest('div')!.parentElement!
    fireEvent.click(within(card).getByRole('button', { name: 'Add Category' }))
    type('Add Category name', 'Dining Out')
    expect(Object.values(useBudgetStore.getState().categories).some((c) => c.name === 'Dining Out' && c.groupId === 'g1')).toBe(true)
  })

  it('adds a group', () => {
    open('Categories')
    fireEvent.click(screen.getByRole('button', { name: 'Add Group' }))
    type('Add Group name', 'Fun')
    expect(Object.values(useBudgetStore.getState().categoryGroups).some((g) => g.name === 'Fun')).toBe(true)
  })

  it('asks before removing a category and keeps it on cancel', () => {
    open('Categories')
    fireEvent.click(screen.getByRole('button', { name: 'Remove category Groceries' }))
    expect(screen.getByText('Remove Category?')).toBeInTheDocument()
    expect(screen.getByText('Its transactions stay, but become uncategorized.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(useBudgetStore.getState().categories.c1).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Remove category Groceries' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(useBudgetStore.getState().categories.c1).toBeUndefined()
  })

  it('only offers group removal for an empty group', () => {
    open('Categories')
    expect(screen.getByRole('button', { name: 'Remove group Empty' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove group Food' })).not.toBeInTheDocument()
  })

  it('lists both rule cards on the Rules section', () => {
    open('Rules')
    expect(screen.getByText(/Categorization Rules/)).toBeInTheDocument()
    expect(screen.getByText(/Exclusion Rules/)).toBeInTheDocument()
  })

  it('moves the paradigm description behind an info button that lists every paradigm', () => {
    render(<BudgetSetupMobile selectedMonth="2026-10" />)
    expect(screen.queryByText(/Freeform tracking/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'About budgeting paradigms' }))
    const dialog = screen.getByRole('dialog', { name: 'Budgeting paradigms' })
    expect(within(dialog).getByText(/Freeform tracking/)).toBeInTheDocument()
    expect(within(dialog).getByText(/Every dollar gets a job/)).toBeInTheDocument()
    expect(within(dialog).getByText('Ledger Custom')).toHaveClass('text-accent')
    expect(within(dialog).queryByText(/current/)).not.toBeInTheDocument()
  })
})
