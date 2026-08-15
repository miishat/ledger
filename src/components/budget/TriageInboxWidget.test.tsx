import { fireEvent, render, screen } from '@testing-library/react'
import { TriageInboxWidget } from './TriageInboxWidget'
import { useTriageStore } from '../../store/useTriageStore'
import { useBudgetStore } from '../../store/useBudgetStore'
import { useUndoStore } from '../../store/useUndoStore'

const triageInitial = useTriageStore.getState()
const budgetInitial = useBudgetStore.getState()

beforeEach(() => {
  useTriageStore.setState(triageInitial, true)
  useBudgetStore.setState(budgetInitial, true)
})

describe('TriageInboxWidget', () => {
  it('renders nothing when the inbox is empty', () => {
    const { container } = render(<TriageInboxWidget />)
    expect(container).toBeEmptyDOMElement()
  })

  it('counts the pending transactions in its title', () => {
    useTriageStore.getState().addPending([
      { id: 'p1', date: '2026-08-01', amount: 12, description: 'NETFLIX', type: 'expense' },
      { id: 'p2', date: '2026-08-02', amount: 30, description: 'HYDRO', type: 'expense' },
    ])
    render(<TriageInboxWidget />)
    expect(screen.getByText('Triage Inbox (2)')).toBeInTheDocument()
  })

  it('lists each pending description', () => {
    useTriageStore.getState().addPending([
      { id: 'p1', date: '2026-08-01', amount: 12, description: 'NETFLIX', type: 'expense' },
    ])
    render(<TriageInboxWidget />)
    expect(screen.getByText('NETFLIX')).toBeInTheDocument()
  })

  it('marks duplicate rows and offers to reject them all', () => {
    useTriageStore.setState({
      pendingTransactions: {
        a: { id: 'a', date: '2026-08-04', amount: 10, description: 'Clean', type: 'expense' },
        b: { id: 'b', date: '2026-08-04', amount: 20, description: 'Dupe', type: 'expense', duplicate: 'exact' },
      },
    })
    render(<TriageInboxWidget />)
    expect(screen.getByText('already imported')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accept All (1)' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reject 1 duplicate' }))
    expect(Object.keys(useTriageStore.getState().pendingTransactions)).toEqual(['a'])
  })

  it('offers an undo that removes everything Accept All added', () => {
    useUndoStore.setState({ pending: null })
    useBudgetStore.setState({ transactions: {}, categories: {} })
    useTriageStore.setState({
      pendingTransactions: {
        a: { id: 'a', date: '2026-08-04', amount: 10, description: 'Clean', type: 'expense' },
        b: { id: 'b', date: '2026-08-05', amount: 20, description: 'Also clean', type: 'expense' },
      },
    })
    render(<TriageInboxWidget />)
    fireEvent.click(screen.getByRole('button', { name: 'Accept All (2)' }))

    expect(Object.keys(useBudgetStore.getState().transactions).sort()).toEqual(['a', 'b'])
    expect(useUndoStore.getState().pending?.label).toBe('Added 2 transactions')

    useUndoStore.getState().runUndo()
    expect(useBudgetStore.getState().transactions).toEqual({})
  })

  it('offers an undo that puts a cleared triage inbox back', () => {
    useUndoStore.setState({ pending: null })
    useTriageStore.setState({
      pendingTransactions: {
        a: { id: 'a', date: '2026-08-04', amount: 10, description: 'Clean', type: 'expense' },
      },
    })
    render(<TriageInboxWidget />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear All' })[1])

    expect(useTriageStore.getState().pendingTransactions).toEqual({})
    useUndoStore.getState().runUndo()
    expect(Object.keys(useTriageStore.getState().pendingTransactions)).toEqual(['a'])
  })
})
