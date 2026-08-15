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

describe('TransactionModal shared bill and reimbursement controls', () => {
  it('adds a shared expense with the user share as amount and the remainder owed', () => {
    seed()
    const onClose = vi.fn()
    render(<TransactionModal isOpen onClose={onClose} />)

    fireEvent.click(screen.getByLabelText(/shared bill/i))
    const totalInput = screen.getAllByPlaceholderText('0.00')[1] as HTMLInputElement
    fireEvent.change(totalInput, { target: { value: '120' } })
    fireEvent.blur(totalInput)

    fireEvent.click(screen.getByRole('button', { name: /my share 50%/i }))

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. alex, roommates/i), {
      target: { value: 'Alex' },
    })

    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }))

    const saved = Object.values(useBudgetStore.getState().transactions)[0]
    expect(saved.amount).toBe(60)
    expect(saved.shared).toEqual({ totalAmount: 120, sharedWith: 'Alex' })
  })

  it('does not attach shared field when sharedWith is empty', () => {
    seed()
    render(<TransactionModal isOpen onClose={() => {}} />)

    fireEvent.click(screen.getByLabelText(/shared bill/i))
    const totalInput = screen.getAllByPlaceholderText('0.00')[1] as HTMLInputElement
    fireEvent.change(totalInput, { target: { value: '120' } })
    fireEvent.blur(totalInput)
    fireEvent.click(screen.getByRole('button', { name: /my share 50%/i }))

    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }))

    const saved = Object.values(useBudgetStore.getState().transactions)[0]
    expect(saved.shared).toBeUndefined()
  })

  it('adds a reimbursement income with the from field set', () => {
    seed()
    render(<TransactionModal isOpen onClose={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Income' }))
    fireEvent.click(screen.getByLabelText(/reimbursement/i))
    fireEvent.change(screen.getByPlaceholderText(/who paid you back/i), {
      target: { value: 'Alex' },
    })
    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement
    fireEvent.change(amountInput, { target: { value: '60' } })
    fireEvent.blur(amountInput)

    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }))

    const saved = Object.values(useBudgetStore.getState().transactions)[0]
    expect(saved.reimbursement).toEqual({ from: 'Alex' })
  })

  it('prefills shared fields when editing a shared expense', () => {
    seed()
    useBudgetStore.setState({
      transactions: {
        t1: {
          id: 't1',
          type: 'expense',
          amount: 60,
          categoryId: 'groceries',
          date: '2026-07-01',
          description: 'Dinner',
          shared: { totalAmount: 120, sharedWith: 'Alex' },
        },
      },
    })
    const initial = useBudgetStore.getState().transactions.t1
    render(<TransactionModal isOpen onClose={() => {}} initialTransaction={initial} />)

    expect(screen.getByLabelText(/shared bill/i)).toBeChecked()
    expect(screen.getByDisplayValue('Alex')).toBeInTheDocument()
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

describe('TransactionModal splits, tags and note', () => {
  it('saves the slices the user entered and shows what is left to allocate', () => {
    useBudgetStore.setState({
      categoryGroups: { g1: { id: 'g1', name: 'Food', kind: 'expense' } },
      categories: {
        groceries: { id: 'groceries', groupId: 'g1', name: 'Groceries', targetAmount: 0 },
        household: { id: 'household', groupId: 'g1', name: 'Household', targetAmount: 0 },
      },
      transactions: {},
    })
    render(<TransactionModal isOpen onClose={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '180' } })
    fireEvent.blur(screen.getByPlaceholderText('0.00'))
    fireEvent.click(screen.getByLabelText('Split across categories'))
    fireEvent.click(screen.getByRole('button', { name: 'Add a slice' }))

    const sliceAmounts = screen.getAllByLabelText('Slice amount')
    fireEvent.change(sliceAmounts[0], { target: { value: '120' } })
    fireEvent.blur(sliceAmounts[0])

    expect(screen.getByText(/\$60.*left to allocate/i)).toBeInTheDocument()

    fireEvent.submit(screen.getByRole('button', { name: 'Add Transaction' }).closest('form') as HTMLFormElement)

    const saved = Object.values(useBudgetStore.getState().transactions)[0]
    expect(saved.amount).toBe(180)
    expect(saved.splits).toEqual([{ categoryId: 'groceries', amount: 120 }])
  })

  it('saves tags lower-cased and de-duplicated, and saves the note', () => {
    useBudgetStore.setState({
      categoryGroups: { g1: { id: 'g1', name: 'Food', kind: 'expense' } },
      categories: { groceries: { id: 'groceries', groupId: 'g1', name: 'Groceries', targetAmount: 0 } },
      transactions: {},
    })
    render(<TransactionModal isOpen onClose={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '20' } })
    fireEvent.blur(screen.getByPlaceholderText('0.00'))
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'Trip, trip , Reimbursable' } })
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'split with Sam' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Add Transaction' }).closest('form') as HTMLFormElement)

    const saved = Object.values(useBudgetStore.getState().transactions)[0]
    expect(saved.tags).toEqual(['trip', 'reimbursable'])
    expect(saved.note).toBe('split with Sam')
  })

  it('leaves splits undefined when the user never opens the split editor', () => {
    useBudgetStore.setState({
      categoryGroups: { g1: { id: 'g1', name: 'Food', kind: 'expense' } },
      categories: { groceries: { id: 'groceries', groupId: 'g1', name: 'Groceries', targetAmount: 0 } },
      transactions: {},
    })
    render(<TransactionModal isOpen onClose={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '20' } })
    fireEvent.blur(screen.getByPlaceholderText('0.00'))
    fireEvent.submit(screen.getByRole('button', { name: 'Add Transaction' }).closest('form') as HTMLFormElement)

    const saved = Object.values(useBudgetStore.getState().transactions)[0]
    expect(saved.splits).toBeUndefined()
    expect(saved.tags).toBeUndefined()
  })
})
