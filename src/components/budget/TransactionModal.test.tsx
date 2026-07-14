import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { TransactionModal } from './TransactionModal'
import { useBudgetStore } from '../../store/useBudgetStore'
import { setMatchMedia } from '../../test-utils/matchMedia'

const seed = () =>
  useBudgetStore.setState({
    categoryGroups: {
      gi: { id: 'gi', name: 'Income', kind: 'income' },
      ge: { id: 'ge', name: 'Food', kind: 'expense' },
    },
    categories: {
      salary: { id: 'salary', groupId: 'gi', name: 'Salary', targetAmount: 0 },
      groceries: { id: 'groceries', groupId: 'ge', name: 'Groceries', targetAmount: 0 },
    },
    transactions: {},
  })

describe('TransactionModal category filtering', () => {
  it('shows only expense categories for expense type', () => {
    seed()
    render(<TransactionModal isOpen onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /uncategorized|groceries/i }))
    expect(screen.getByRole('option', { name: /groceries/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /salary/i })).not.toBeInTheDocument()
  })

  it('shows only income categories for income type', () => {
    seed()
    render(<TransactionModal isOpen onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Income' }))
    fireEvent.click(screen.getByRole('button', { name: /uncategorized|salary/i }))
    expect(screen.getByRole('option', { name: /salary/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /groceries/i })).not.toBeInTheDocument()
  })
})

describe('TransactionModal scrim dismissal', () => {
  it('renders when open and closes via scrim', () => {
    seed()
    setMatchMedia(true)
    const onClose = vi.fn()
    const { getByTestId } = render(<TransactionModal isOpen onClose={onClose} />)
    expect(getByTestId('sheet-panel')).toBeInTheDocument()
    fireEvent.click(getByTestId('sheet-scrim'))
    expect(onClose).toHaveBeenCalled()
  })
})
