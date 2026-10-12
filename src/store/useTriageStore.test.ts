import { useTriageStore } from './useTriageStore'
import { useBudgetStore } from './useBudgetStore'
import type { TriageTransaction } from '../types/triage'
import { buildBackup, restoreBackup } from '../utils/backup'
import { useUndoStore } from './useUndoStore'

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

const seed = () =>
  useTriageStore.setState({
    pendingTransactions: {
      a: { id: 'a', date: '2026-08-22', amount: 4.29, description: 'LIDL', type: 'expense' },
      b: {
        id: 'b', date: '2026-08-21', amount: 50, description: 'Payment Thank You-Mobile',
        type: 'income', flag: 'card-payment',
      },
    },
  })

describe('triage store card payment flag', () => {
  it('holds flagged rows back from approveAll', () => {
    seed()
    const approved = useTriageStore.getState().approveAll()
    expect(approved).toEqual(['a'])
    expect(Object.keys(useTriageStore.getState().pendingTransactions)).toEqual(['b'])
    expect(useBudgetStore.getState().transactions['b']).toBeUndefined()
  })

  it('still approves a flagged row individually', () => {
    seed()
    useTriageStore.getState().approveTransaction('b')
    expect(useBudgetStore.getState().transactions['b']).toBeDefined()
  })

  it('rejectCardPayments clears only the flagged rows', () => {
    seed()
    useTriageStore.getState().rejectCardPayments()
    expect(Object.keys(useTriageStore.getState().pendingTransactions)).toEqual(['a'])
  })
})

describe('remembered imports', () => {
  const coffees = (prefix: string) => [pending({ id: `${prefix}1`, amount: 5, description: 'Coffee' }), pending({ id: `${prefix}2`, amount: 5, description: 'Coffee' })]
  const importCoffees = () => {
    const store = useTriageStore.getState()
    const sourceId = store.createImportSource('Card A')
    store.importTransactions(coffees('a'), sourceId)
    return sourceId
  }

  it('remembers accepted and ignored occurrences even after the accepted amount and description change', () => {
    const sourceId = importCoffees()
    const store = useTriageStore.getState()
    store.approveTransaction('a1')
    store.rejectTransaction('a2')
    useBudgetStore.getState().updateTransaction('a1', { amount: 2.5, description: 'My coffee share', shared: { totalAmount: 5, sharedWith: 'Friend' } })
    store.importTransactions(coffees('b'), sourceId)
    expect(useTriageStore.getState().pendingTransactions).toEqual({})
    expect(useTriageStore.getState().lastImport?.skippedIds).toHaveLength(2)
    expect(useTriageStore.getState().importRecords.a1.original.amount).toBe(5)
    expect(useTriageStore.getState().importRecords.a2.decision).toBe('ignored')
  })

  it('does not duplicate rows still waiting for review', () => {
    const sourceId = importCoffees()
    useTriageStore.getState().importTransactions(coffees('b'), sourceId)
    expect(Object.keys(useTriageStore.getState().pendingTransactions)).toEqual(['a1', 'a2'])
  })

  it('lets cancelled rows import again and undo cancellation restore their history', () => {
    const sourceId = importCoffees()
    const rows = Object.values(useTriageStore.getState().pendingTransactions)
    useTriageStore.getState().clearAll()
    expect(useTriageStore.getState().importRecords).toEqual({})
    expect(useTriageStore.getState().importDays).toEqual([])
    useTriageStore.getState().addPending(rows)
    useTriageStore.getState().importTransactions(coffees('b'), sourceId)
    expect(Object.keys(useTriageStore.getState().pendingTransactions)).toEqual(['a1', 'a2'])
  })

  it('restores an ignored charge to review with its original bank amount', () => {
    importCoffees()
    useTriageStore.getState().rejectTransaction('a1')
    useTriageStore.getState().restoreImportRecord('a1')
    expect(useTriageStore.getState().pendingTransactions.a1.amount).toBe(5)
    expect(useTriageStore.getState().importRecords.a1.decision).toBe('pending')
  })

  it('returns accepted decisions to pending during Accept All undo', () => {
    importCoffees()
    const rows = Object.values(useTriageStore.getState().pendingTransactions)
    const ids = useTriageStore.getState().approveAll()
    useBudgetStore.getState().deleteTransactions(ids)
    useTriageStore.getState().addPending(rows)
    expect(useTriageStore.getState().importRecords.a1.decision).toBe('pending')
    expect(useTriageStore.getState().importRecords.a2.decision).toBe('pending')
  })

  it('keeps history after deletion of an accepted budget transaction', () => {
    const sourceId = importCoffees()
    useTriageStore.getState().approveAll()
    useBudgetStore.getState().deleteTransactions(['a1', 'a2'])
    useTriageStore.getState().importTransactions(coffees('b'), sourceId)
    expect(useTriageStore.getState().pendingTransactions).toEqual({})
  })

  it('tracks deliberate duplicate resolution without adding another real occurrence', () => {
    const sourceId = importCoffees()
    useTriageStore.getState().approveAll()
    useTriageStore.getState().importTransactions([...coffees('b'), pending({ id: 'extra', amount: 5, description: 'Coffee' })], sourceId)
    useTriageStore.getState().resolveDuplicate('extra')
    expect(useTriageStore.getState().importRecords.extra.decision).toBe('duplicate')
    expect(useTriageStore.getState().importRecords.extra.matchedRecordId).toBeTruthy()
  })

  it('migrates version-1 inboxes without inventing old source identity', async () => {
    localStorage.setItem('ledger-triage', JSON.stringify({ state: { pendingTransactions: { old: pending({ id: 'old' }) }, categoryRules: { coffee: 'c' } }, version: 1 }))
    await useTriageStore.persist.rehydrate()
    expect(useTriageStore.getState().pendingTransactions.old).toBeDefined()
    expect(useTriageStore.getState().importRecords).toEqual({})
    expect(useTriageStore.getState().importSources).toEqual({})
  })

  it('backs up and restores import history through the existing triage key', async () => {
    importCoffees()
    useTriageStore.getState().rejectTransaction('a1')
    const envelope = buildBackup()
    useTriageStore.setState(triageInitial, true)
    restoreBackup(envelope)
    await useTriageStore.persist.rehydrate()
    expect(useTriageStore.getState().importRecords.a1.decision).toBe('ignored')
    expect(useTriageStore.getState().importDays).toHaveLength(1)
    expect(Object.values(useTriageStore.getState().importSources)[0].name).toBe('Card A')
  })

  it('invalidates duplicate decisions that refer to cancelled pending originals', () => {
    const store = useTriageStore.getState()
    const sourceId = store.createImportSource('Card A')
    store.importTransactions([pending({ id: 'a', description: 'Coffee' })], sourceId)
    store.importTransactions([pending({ id: 'b', description: 'Coffee shop' })], sourceId)
    store.resolveDuplicate('b')
    store.clearAll()
    store.importTransactions([pending({ id: 'c', description: 'Coffee shop' })], sourceId)
    expect(useTriageStore.getState().pendingTransactions.c).toBeDefined()
    expect(useTriageStore.getState().lastImport?.skippedIds).toEqual([])
  })

  it('dismisses stale undo when another import is confirmed', () => {
    const sourceId = importCoffees()
    const rows = Object.values(useTriageStore.getState().pendingTransactions)
    useTriageStore.getState().clearAll()
    useUndoStore.getState().offerUndo('Discarded', () => useTriageStore.getState().addPending(rows))
    useTriageStore.getState().importTransactions(coffees('b'), sourceId)
    useUndoStore.getState().runUndo()
    expect(Object.keys(useTriageStore.getState().pendingTransactions)).toEqual(['b1', 'b2'])
  })

  it('binds a recognized card to an existing manual source without losing its history', () => {
    const sourceId = importCoffees()
    useTriageStore.getState().approveAll()
    useTriageStore.getState().bindImportSource(sourceId, 'cibc:1234:5678')
    expect(useTriageStore.getState().createImportSource('CIBC card 5678', 'cibc:1234:5678')).toBe(sourceId)
    useTriageStore.getState().importTransactions(coffees('b'), sourceId)
    expect(useTriageStore.getState().lastImport?.skippedIds).toHaveLength(2)
  })
})
