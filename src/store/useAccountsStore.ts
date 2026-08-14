import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from './storageKeys'
import { v4 as uuidv4 } from 'uuid';

export type AccountType = 'bank' | 'investment' | 'debt' | 'receivable' | 'other';

export interface Account {
  id: string;
  name: string;
  value: number;
  type: AccountType;
}

export interface NetWorthSnapshot {
  date: string; // YYYY-MM-DD
  value: number;
}

interface AccountsState {
  accounts: Account[];
  history: NetWorthSnapshot[];
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id'>>) => void;
  removeAccount: (id: string) => void;
  getAccountsByType: (type: AccountType) => Account[];
  getTotalByType: (type: AccountType) => number;
  getNetWorth: () => number;
  recordSnapshot: () => void;
  getNetWorthTrend: () => number;
}

/** The demo accounts every install used to boot with, before 0.8.1-beta. Kept
 *  so the migration can recognise and remove them. */
export const DEMO_ACCOUNTS: Account[] = [
  { id: '1', name: 'Main Checking', value: 15000, type: 'bank' },
  { id: '2', name: 'Vanguard 401k', value: 120000, type: 'investment' },
  { id: '3', name: 'Mortgage', value: 350000, type: 'debt' },
  { id: '4', name: 'Personal Loan to Bob', value: 5000, type: 'receivable' },
]

/** A fresh install no longer ships demo accounts. Existing installs drop the
 *  four seeded rows only if they are still present untouched. A row the user
 *  renamed, revalued, or retyped is theirs now and is kept, as is anything
 *  they added. If, and only if, at least one demo row was actually removed,
 *  the net worth history is cleared too: those snapshots were computed while
 *  the fake demo money was included in the total, so they no longer describe
 *  the user's real net worth and cannot be salvaged. A user whose accounts
 *  never matched a demo row (they had already deleted them, or never had
 *  them) keeps their history untouched, since it is genuine.
 *
 *  This runs on every rehydration (via `merge`), not gated by a stored
 *  version number, so that older builds without this logic can still read a
 *  snapshot written by this build (see the persist options below for why the
 *  `version` field itself is intentionally omitted). Once the demos are gone
 *  it is a no-op: nothing matches, nothing is removed, history is untouched. */
export function stripDemoAccounts(persisted: unknown): unknown {
  const state = persisted as { accounts?: Account[]; history?: NetWorthSnapshot[] } | null
  if (!state?.accounts || !Array.isArray(state.accounts)) return persisted
  const accounts = state.accounts.filter(
    (a) =>
      !DEMO_ACCOUNTS.some(
        (d) => d.id === a.id && d.name === a.name && d.value === a.value && d.type === a.type,
      ),
  )
  const removedAny = accounts.length !== state.accounts.length
  return { ...state, accounts, ...(removedAny ? { history: [] } : {}) }
}

export const useAccountsStore = create<AccountsState>()(
  persist(
    (set, get) => ({
      accounts: [],
      history: [],

      addAccount: (accountData) => {
        set((state) => ({
          accounts: [...state.accounts, { ...accountData, id: uuidv4() }],
        }));
        get().recordSnapshot();
      },

      updateAccount: (id, updates) => {
        set((state) => ({
          accounts: state.accounts.map((acc) => 
            acc.id === id ? { ...acc, ...updates } : acc
          ),
        }));
        get().recordSnapshot();
      },

      removeAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter((acc) => acc.id !== id),
        }));
        get().recordSnapshot();
      },

      getAccountsByType: (type) => {
        return get().accounts.filter((acc) => acc.type === type);
      },

      getTotalByType: (type) => {
        const accounts = get().getAccountsByType(type);
        return accounts.reduce((sum, acc) => sum + acc.value, 0);
      },

      getNetWorth: () => {
        const state = get();
        const bank = state.getTotalByType('bank');
        const investment = state.getTotalByType('investment');
        const receivable = state.getTotalByType('receivable');
        const other = state.getTotalByType('other');
        const debt = state.getTotalByType('debt');

        return (bank + investment + receivable + other) - debt;
      },

      recordSnapshot: () => {
        const state = get();
        const currentNetWorth = state.getNetWorth();
        const today = new Date().toISOString().split('T')[0];
        
        set((state) => {
          const existingIndex = state.history.findIndex(h => h.date === today);
          const newHistory = [...state.history];
          
          if (existingIndex >= 0) {
            newHistory[existingIndex] = { date: today, value: currentNetWorth };
          } else {
            newHistory.push({ date: today, value: currentNetWorth });
          }
          
          newHistory.sort((a, b) => a.date.localeCompare(b.date));
          
          return { history: newHistory };
        });
      },

      getNetWorthTrend: () => {
        const state = get();
        const current = state.getNetWorth();
        
        const now = new Date();
        const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfLastMonth = new Date(firstOfThisMonth.getTime() - 1);
        const endOfLastMonthStr = endOfLastMonth.toISOString().split('T')[0];
        
        const pastSnapshot = [...state.history].reverse().find(h => h.date <= endOfLastMonthStr);
        
        if (!pastSnapshot || pastSnapshot.value === 0) return 0;
        
        return ((current - pastSnapshot.value) / pastSnapshot.value) * 100;
      },
    }),
    {
      name: STORAGE_KEYS.accounts,
      // Intentionally no `version` here. zustand writes `{ state, version:
      // options.version }`, and with `options.version` undefined,
      // JSON.stringify drops the key entirely, so a snapshot written by this
      // build stays version-less and a build on the previous release can
      // still read it on its normal (non-migrate) path instead of falling
      // back to its initial state. The demo-account cleanup lives in
      // `merge`, which zustand calls on every rehydration regardless of
      // version. `migrate` is kept only as a self-heal path for a machine
      // that already has `"version": 1` written to localStorage from an
      // earlier build of this same branch: with `options.version` undefined
      // and a stored version of 1, zustand still detects a mismatch and
      // calls `migrate` rather than discarding the state. After that one
      // load the entry is rewritten without a version field and the machine
      // is healed.
      migrate: (persisted) => stripDemoAccounts(persisted),
      merge: (persisted, current) => ({ ...current, ...(stripDemoAccounts(persisted) as object) }),
    }
  )
);
