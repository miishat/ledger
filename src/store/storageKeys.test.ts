import { STORAGE_KEYS } from './storageKeys'

// Raw source of every persisted store, so the test can prove each one reads its
// key from the registry instead of inlining a string. Every store file is named
// use*Store.ts, and this glob deliberately does not match use*Store.test.ts.
const storeSources = import.meta.glob('./use*Store.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('storage key registry', () => {
  // These strings are what real users' data is filed under. Changing one
  // orphans their data, so they are pinned here rather than merely counted.
  it('pins the exact persisted key strings', () => {
    expect(STORAGE_KEYS).toEqual({
      accounts: 'accounts-storage',
      budget: 'ledger-budget',
      compensation: 'ledger-compensation',
      theme: 'financial-dashboard-theme',
      triage: 'ledger-triage',
      marketData: 'ledger-market-data',
      planner: 'ledger-planner',
      analyses: 'ledger-analyses',
      portfolio: 'ledger-portfolio',
      portfolioReport: 'ledger-portfolio-report',
      dashboardLayout: 'ledger-dashboard-layout',
      wheel: 'ledger-wheel',
      sync: 'ledger-sync',
    })
  })

  it('never files two stores under the same key', () => {
    const values = Object.values(STORAGE_KEYS)
    expect(new Set(values).size).toBe(values.length)
  })

  it('finds every persisted store', () => {
    const persisted = Object.entries(storeSources).filter(([, src]) => src.includes('persist('))
    expect(persisted.length).toBe(Object.keys(STORAGE_KEYS).length)
  })

  it('has every persisted store take its key from the registry', () => {
    for (const [path, src] of Object.entries(storeSources)) {
      if (!src.includes('persist(')) continue
      expect(src, `${path} must use STORAGE_KEYS, not an inline key string`).toContain('STORAGE_KEYS.')
    }
  })
})
