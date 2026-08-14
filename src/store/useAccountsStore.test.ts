import { useAccountsStore, migrateAccountsState, DEMO_ACCOUNTS } from './useAccountsStore'

const initialState = useAccountsStore.getState()

beforeEach(() => {
  useAccountsStore.setState(initialState, true)
})

describe('useAccountsStore defaults', () => {
  it('starts with no accounts so a new install shows the user their own money only', () => {
    expect(useAccountsStore.getState().accounts).toEqual([])
    expect(useAccountsStore.getState().getNetWorth()).toBe(0)
  })
})

describe('useAccountsStore net worth', () => {
  it('subtracts debts from assets', () => {
    useAccountsStore.setState({
      accounts: [
        { id: 'a', name: 'Chequing', value: 1000, type: 'bank' },
        { id: 'b', name: 'Brokerage', value: 4000, type: 'investment' },
        { id: 'c', name: 'Owed by Sam', value: 500, type: 'receivable' },
        { id: 'd', name: 'Card', value: 1500, type: 'debt' },
      ],
    })
    expect(useAccountsStore.getState().getNetWorth()).toBe(4000)
  })

  it('records one snapshot per day and overwrites the same day rather than appending', () => {
    useAccountsStore.getState().addAccount({ name: 'Chequing', value: 100, type: 'bank' })
    useAccountsStore.getState().addAccount({ name: 'Savings', value: 200, type: 'bank' })
    const history = useAccountsStore.getState().history
    expect(history).toHaveLength(1)
    expect(history[0].value).toBe(300)
  })

  it('reports a zero trend when there is no earlier snapshot to compare against', () => {
    useAccountsStore.setState({
      accounts: [{ id: 'a', name: 'Chequing', value: 1000, type: 'bank' }],
      history: [],
    })
    expect(useAccountsStore.getState().getNetWorthTrend()).toBe(0)
  })
})

describe('migrateAccountsState v0 to v1', () => {
  it('drops the four untouched demo accounts', () => {
    const migrated = migrateAccountsState({ accounts: [...DEMO_ACCOUNTS], history: [] }, 0) as {
      accounts: unknown[]
    }
    expect(migrated.accounts).toEqual([])
  })

  it('keeps a demo row the user edited', () => {
    const edited = { ...DEMO_ACCOUNTS[0], value: 22000 }
    const migrated = migrateAccountsState({ accounts: [edited], history: [] }, 0) as {
      accounts: { value: number }[]
    }
    expect(migrated.accounts).toEqual([edited])
  })

  it("keeps the user's own accounts alongside removing the demo rows", () => {
    const mine = { id: 'mine', name: 'Tangerine', value: 42, type: 'bank' as const }
    const migrated = migrateAccountsState({ accounts: [...DEMO_ACCOUNTS, mine], history: [] }, 0) as {
      accounts: unknown[]
    }
    expect(migrated.accounts).toEqual([mine])
  })

  it('leaves already-migrated state alone', () => {
    const state = { accounts: [...DEMO_ACCOUNTS], history: [] }
    expect(migrateAccountsState(state, 1)).toBe(state)
  })

  it('survives state with no accounts array', () => {
    expect(migrateAccountsState({ history: [] }, 0)).toEqual({ history: [] })
  })
})
