import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TriageTransaction } from '../types/triage';
import { useBudgetStore } from './useBudgetStore';

interface TriageState {
  pendingTransactions: Record<string, TriageTransaction>;
  categoryRules: Record<string, string>;
  
  addPending: (transactions: TriageTransaction[]) => void;
  updatePending: (id: string, updates: Partial<TriageTransaction>) => void;
  approveTransaction: (id: string) => void;
  approveAll: () => void;
  rejectTransaction: (id: string) => void;
  clearAll: () => void;
  learnRule: (description: string, categoryId: string) => void;
  removeRule: (description: string) => void;
}

export const useTriageStore = create<TriageState>()(
  persist(
    (set, get) => ({
      pendingTransactions: {},
      categoryRules: {},

      learnRule: (description, categoryId) =>
        set((state) => ({
          categoryRules: { ...state.categoryRules, [description]: categoryId },
        })),

      removeRule: (description) =>
        set((state) => {
          const newRules = { ...state.categoryRules };
          delete newRules[description];
          return { categoryRules: newRules };
        }),

      addPending: (transactions) =>
        set((state) => {
          const newPending = { ...state.pendingTransactions };
          transactions.forEach((tx) => {
            newPending[tx.id] = tx;
          });
          return { pendingTransactions: newPending };
        }),

      updatePending: (id, updates) =>
        set((state) => ({
          pendingTransactions: {
            ...state.pendingTransactions,
            [id]: { ...state.pendingTransactions[id], ...updates },
          },
        })),

      approveTransaction: (id) => {
        const state = get();
        const tx = state.pendingTransactions[id];
        if (!tx) return;
        
        // Push to main budget store
        useBudgetStore.getState().addTransaction({
          id: tx.id,
          date: tx.date,
          amount: tx.amount,
          categoryId: tx.categoryId || '',
          description: tx.description,
          type: tx.type,
        });

        // Learn the rule if a category is assigned
        if (tx.categoryId) {
          state.learnRule(tx.description, tx.categoryId);
        }

        // Remove from triage
        set((state) => {
          const newPending = { ...state.pendingTransactions };
          delete newPending[id];
          return { pendingTransactions: newPending };
        });
      },

      approveAll: () => {
        const state = get();
        const budgetState = useBudgetStore.getState();
        const txs = Object.values(state.pendingTransactions);
        
        txs.forEach((tx) => {
          budgetState.addTransaction({
            id: tx.id,
            date: tx.date,
            amount: tx.amount,
            categoryId: tx.categoryId || '',
            description: tx.description,
            type: tx.type,
          });
          
          if (tx.categoryId) {
            state.learnRule(tx.description, tx.categoryId);
          }
        });
        
        set({ pendingTransactions: {} });
      },

      rejectTransaction: (id) =>
        set((state) => {
          const newPending = { ...state.pendingTransactions };
          delete newPending[id];
          return { pendingTransactions: newPending };
        }),

      clearAll: () => set({ pendingTransactions: {} }),
    }),
    {
      name: 'ledger-triage',
    }
  )
);
