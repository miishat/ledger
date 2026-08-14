import { useAccountsStore, stripDemoAccounts, DEMO_ACCOUNTS } from './useAccountsStore'

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

describe('stripDemoAccounts', () => {
  it('drops the four untouched demo accounts', () => {
    const stripped = stripDemoAccounts({ accounts: [...DEMO_ACCOUNTS], history: [] }) as {
      accounts: unknown[]
    }
    expect(stripped.accounts).toEqual([])
  })

  it('keeps a demo row the user edited', () => {
    const edited = { ...DEMO_ACCOUNTS[0], value: 22000 }
    const stripped = stripDemoAccounts({ accounts: [edited], history: [] }) as {
      accounts: { value: number }[]
    }
    expect(stripped.accounts).toEqual([edited])
  })

  it("keeps the user's own accounts alongside removing the demo rows", () => {
    const mine = { id: 'mine', name: 'Tangerine', value: 42, type: 'bank' as const }
    const stripped = stripDemoAccounts({ accounts: [...DEMO_ACCOUNTS, mine], history: [] }) as {
      accounts: unknown[]
    }
    expect(stripped.accounts).toEqual([mine])
  })

  it('survives state with no accounts array', () => {
    expect(stripDemoAccounts({ history: [] })).toEqual({ history: [] })
  })

  it('survives state where accounts is not an array', () => {
    const state = { accounts: 'not an array', history: [{ date: '2026-01-01', value: 5 }] }
    expect(stripDemoAccounts(state)).toEqual(state)
  })

  it('clears history when demo rows are actually removed', () => {
    const stripped = stripDemoAccounts({
      accounts: [...DEMO_ACCOUNTS],
      history: [{ date: '2026-01-01', value: -220000 }],
    }) as { history: unknown[] }
    expect(stripped.history).toEqual([])
  })

  it('keeps history untouched when no accounts match a demo row', () => {
    const mine = { id: 'mine', name: 'Tangerine', value: 42, type: 'bank' as const }
    const history = [{ date: '2026-01-01', value: 42 }]
    const stripped = stripDemoAccounts({ accounts: [mine], history }) as { history: unknown[] }
    expect(stripped.history).toEqual(history)
  })

  it('is idempotent: a second call on already-stripped state removes nothing more and does not clear history again', () => {
    const mine = { id: 'mine', name: 'Tangerine', value: 42, type: 'bank' as const }
    const history = [{ date: '2026-01-01', value: 42 }]
    const once = stripDemoAccounts({ accounts: [...DEMO_ACCOUNTS, mine], history }) as {
      accounts: unknown[]
      history: unknown[]
    }
    // First call removes the demos and clears history, since demos were present.
    expect(once.accounts).toEqual([mine])
    expect(once.history).toEqual([])

    // A second call on the already-stripped result should be a no-op: nothing
    // left matches a demo row, and history (now empty, but genuinely so) is
    // not cleared again just because it ran a second time.
    const startingHistory = [{ date: '2026-02-01', value: 42 }]
    const twice = stripDemoAccounts({ accounts: once.accounts, history: startingHistory }) as {
      accounts: unknown[]
      history: unknown[]
    }
    expect(twice.accounts).toEqual([mine])
    expect(twice.history).toEqual(startingHistory)
  })
})
