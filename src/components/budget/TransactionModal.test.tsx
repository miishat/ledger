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

describe('TransactionModal negative amounts', () => {
  const setAmount = (value: string) => {
    const input = screen.getAllByPlaceholderText('0.00')[0] as HTMLInputElement
    fireEvent.change(input, { target: { value } })
    fireEvent.blur(input)
  }

  const submit = () => fireEvent.click(screen.getByRole('button', { name: /add transaction|save/i }))

  it('accepts a negative expense as a refund', () => {
    seed()
    render(<TransactionModal isOpen onClose={() => {}} />)
    setAmount('-39.99')
    submit()

    const saved = Object.values(useBudgetStore.getState().transactions)
    expect(saved).toHaveLength(1)
    expect(saved[0].amount).toBe(-39.99)
    expect(saved[0].type).toBe('expense')
  })

  it('still rejects a negative income', () => {
    seed()
    render(<TransactionModal isOpen onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Income' }))
    setAmount('-10')
    submit()

    expect(screen.getByRole('alert')).toHaveTextContent('Enter an amount greater than zero.')
    expect(Object.values(useBudgetStore.getState().transactions)).toHaveLength(0)
  })

  it('still rejects an amount of exactly zero', () => {
    seed()
    render(<TransactionModal isOpen onClose={() => {}} />)
    setAmount('0')
    submit()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(Object.values(useBudgetStore.getState().transactions)).toHaveLength(0)
  })
})

describe('TransactionModal negative expense splitting is out of scope', () => {
  const setAmount = (value: string) => {
    const input = screen.getAllByPlaceholderText('0.00')[0] as HTMLInputElement
    fireEvent.change(input, { target: { value } })
    fireEvent.blur(input)
  }

  it('hides the split control once the amount goes negative', () => {
    seed()
    render(<TransactionModal isOpen onClose={() => {}} />)
    setAmount('50')
    expect(screen.getByLabelText('Split across categories')).toBeInTheDocument()

    setAmount('-50')
    expect(screen.queryByLabelText('Split across categories')).not.toBeInTheDocument()
  })

  it('does not save splits on a negative expense, even if slices were entered before the amount went negative', () => {
    useBudgetStore.setState({
      categoryGroups: { g1: { id: 'g1', name: 'Food', kind: 'expense' } },
      categories: {
        groceries: { id: 'groceries', groupId: 'g1', name: 'Groceries', targetAmount: 0 },
        household: { id: 'household', groupId: 'g1', name: 'Household', targetAmount: 0 },
      },
      transactions: {},
    })
    render(<TransactionModal isOpen onClose={() => {}} />)

    setAmount('180')
    fireEvent.click(screen.getByLabelText('Split across categories'))
    fireEvent.click(screen.getByRole('button', { name: 'Add a slice' }))
    const sliceAmounts = screen.getAllByLabelText('Slice amount')
    fireEvent.change(sliceAmounts[0], { target: { value: '120' } })
    fireEvent.blur(sliceAmounts[0])

    // Flip the amount negative after slices were entered: the split control
    // disappears, but isSplit/splits still live in component state, so the
    // save-time guard is what must close this path.
    setAmount('-180')
    fireEvent.submit(screen.getByRole('button', { name: 'Add Transaction' }).closest('form') as HTMLFormElement)

    const saved = Object.values(useBudgetStore.getState().transactions)[0]
    expect(saved.amount).toBe(-180)
    expect(saved.splits).toBeUndefined()
  })

  it('refuses to save when the slices exceed the amount', () => {
    useBudgetStore.setState({
      categoryGroups: { g1: { id: 'g1', name: 'Food', kind: 'expense' } },
      categories: {
        groceries: { id: 'groceries', groupId: 'g1', name: 'Groceries', targetAmount: 0 },
        household: { id: 'household', groupId: 'g1', name: 'Household', targetAmount: 0 },
      },
      transactions: {},
    })
    const onClose = vi.fn()
    render(<TransactionModal isOpen onClose={onClose} />)

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100' } })
    fireEvent.blur(screen.getByPlaceholderText('0.00'))
    fireEvent.click(screen.getByLabelText('Split across categories'))

    const sliceAmounts = screen.getAllByLabelText('Slice amount')
    fireEvent.change(sliceAmounts[0], { target: { value: '150' } })
    fireEvent.blur(sliceAmounts[0])

    fireEvent.submit(screen.getByRole('button', { name: 'Add Transaction' }).closest('form') as HTMLFormElement)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Slices add up to more than the amount. Reduce a slice before saving.',
    )
    expect(onClose).not.toHaveBeenCalled()
    expect(Object.values(useBudgetStore.getState().transactions)).toHaveLength(0)
  })

  it('still saves an ordinary positive split exactly as before', () => {
    useBudgetStore.setState({
      categoryGroups: { g1: { id: 'g1', name: 'Food', kind: 'expense' } },
      categories: {
        groceries: { id: 'groceries', groupId: 'g1', name: 'Groceries', targetAmount: 0 },
        household: { id: 'household', groupId: 'g1', name: 'Household', targetAmount: 0 },
      },
      transactions: {},
    })
    render(<TransactionModal isOpen onClose={() => {}} />)

    setAmount('180')
    fireEvent.click(screen.getByLabelText('Split across categories'))
    fireEvent.click(screen.getByRole('button', { name: 'Add a slice' }))
    const sliceAmounts = screen.getAllByLabelText('Slice amount')
    fireEvent.change(sliceAmounts[0], { target: { value: '120' } })
    fireEvent.blur(sliceAmounts[0])

    fireEvent.submit(screen.getByRole('button', { name: 'Add Transaction' }).closest('form') as HTMLFormElement)

    const saved = Object.values(useBudgetStore.getState().transactions)[0]
    expect(saved.amount).toBe(180)
    expect(saved.splits).toEqual([{ categoryId: 'groceries', amount: 120 }])
  })
})
