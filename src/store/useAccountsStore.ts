import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export const useAccountsStore = create<AccountsState>()(
  persist(
    (set, get) => ({
      accounts: [
        { id: '1', name: 'Main Checking', value: 15000, type: 'bank' },
        { id: '2', name: 'Vanguard 401k', value: 120000, type: 'investment' },
        { id: '3', name: 'Mortgage', value: 350000, type: 'debt' },
        { id: '4', name: 'Personal Loan to Bob', value: 5000, type: 'receivable' },
      ],
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
      name: 'accounts-storage',
    }
  )
);
