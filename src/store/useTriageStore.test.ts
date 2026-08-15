import { useTriageStore } from './useTriageStore'
import { useBudgetStore } from './useBudgetStore'
import type { TriageTransaction } from '../types/triage'

const triageInitial = useTriageStore.getState()
const budgetInitial = useBudgetStore.getState()

beforeEach(() => {
  useTriageStore.setState(triageInitial, true)
  useBudgetStore.setState(budgetInitial, true)
})

const pending = (over: Partial<TriageTransaction> = {}): TriageTransaction => ({
  id: 't1',
  date: '2026-08-01',
  amount: 12.5,
  description: 'NETFLIX',
  type: 'expense',
  ...over,
})

describe('useTriageStore approval', () => {
  it('moves an approved transaction into the budget store and out of the inbox', () => {
    useTriageStore.getState().addPending([pending()])
    useTriageStore.getState().approveTransaction('t1')
    expect(useBudgetStore.getState().transactions.t1.description).toBe('NETFLIX')
    expect(useTriageStore.getState().pendingTransactions.t1).toBeUndefined()
  })

  it('learns a rule from an approved transaction that carries a category', () => {
    useTriageStore.getState().addPending([pending({ categoryId: 'c-1' })])
    useTriageStore.getState().approveTransaction('t1')
    expect(useTriageStore.getState().categoryRules.NETFLIX).toBe('c-1')
  })

  it('learns nothing from an uncategorized approval', () => {
    useTriageStore.getState().addPending([pending()])
    useTriageStore.getState().approveTransaction('t1')
    expect(useTriageStore.getState().categoryRules).toEqual({})
  })

  it('ignores an id that is not pending instead of writing an empty transaction', () => {
    useTriageStore.getState().approveTransaction('nope')
    expect(Object.keys(useBudgetStore.getState().transactions)).toHaveLength(0)
  })

  it('approves every pending transaction at once and empties the inbox', () => {
    useTriageStore.getState().addPending([pending(), pending({ id: 't2', description: 'SPOTIFY' })])
    useTriageStore.getState().approveAll()
    expect(Object.keys(useBudgetStore.getState().transactions).sort()).toEqual(['t1', 't2'])
    expect(useTriageStore.getState().pendingTransactions).toEqual({})
  })
})

describe('useTriageStore rejection and rules', () => {
  it('rejects without writing anything to the budget store', () => {
    useTriageStore.getState().addPending([pending()])
    useTriageStore.getState().rejectTransaction('t1')
    expect(useTriageStore.getState().pendingTransactions.t1).toBeUndefined()
    expect(Object.keys(useBudgetStore.getState().transactions)).toHaveLength(0)
  })

  it('clears the whole inbox without approving anything', () => {
    useTriageStore.getState().addPending([pending(), pending({ id: 't2' })])
    useTriageStore.getState().clearAll()
    expect(useTriageStore.getState().pendingTransactions).toEqual({})
    expect(Object.keys(useBudgetStore.getState().transactions)).toHaveLength(0)
  })

  it('updates a pending transaction in place', () => {
    useTriageStore.getState().addPending([pending()])
    useTriageStore.getState().updatePending('t1', { categoryId: 'c-9' })
    expect(useTriageStore.getState().pendingTransactions.t1.categoryId).toBe('c-9')
  })

  it('removes only the named rule', () => {
    useTriageStore.getState().learnRule('NETFLIX', 'c-1')
    useTriageStore.getState().learnRule('SPOTIFY', 'c-2')
    useTriageStore.getState().removeRule('NETFLIX')
    expect(useTriageStore.getState().categoryRules).toEqual({ SPOTIFY: 'c-2' })
  })
})

describe('approveAll with duplicates', () => {
  it('approves only the rows that are not flagged and returns their ids', () => {
    useTriageStore.setState({
      pendingTransactions: {
        a: { id: 'a', date: '2026-08-04', amount: 10, description: 'Clean', type: 'expense' },
        b: { id: 'b', date: '2026-08-04', amount: 20, description: 'Dupe', type: 'expense', duplicate: 'exact' },
      },
    })
    const approved = useTriageStore.getState().approveAll()
    expect(approved).toEqual(['a'])
    expect(Object.keys(useBudgetStore.getState().transactions)).toEqual(['a'])
    expect(Object.keys(useTriageStore.getState().pendingTransactions)).toEqual(['b'])
  })
})

describe('rejectDuplicates', () => {
  it('discards every flagged row and leaves the rest pending', () => {
    useTriageStore.setState({
      pendingTransactions: {
        a: { id: 'a', date: '2026-08-04', amount: 10, description: 'Clean', type: 'expense' },
        b: { id: 'b', date: '2026-08-04', amount: 20, description: 'Dupe', type: 'expense', duplicate: 'possible' },
      },
    })
    useTriageStore.getState().rejectDuplicates()
    expect(Object.keys(useTriageStore.getState().pendingTransactions)).toEqual(['a'])
  })
})
