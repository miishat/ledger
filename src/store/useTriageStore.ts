import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TriageTransaction } from '../types/triage';
import { useBudgetStore } from './useBudgetStore';

interface TriageState {
  pendingTransactions: Record<string, TriageTransaction>;
  
  addPending: (transactions: TriageTransaction[]) => void;
  updatePending: (id: string, updates: Partial<TriageTransaction>) => void;
  approveTransaction: (id: string) => void;
  rejectTransaction: (id: string) => void;
  clearAll: () => void;
}

export const useTriageStore = create<TriageState>()(
  persist(
    (set, get) => ({
      pendingTransactions: {},

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

        // Remove from triage
        set((state) => {
          const newPending = { ...state.pendingTransactions };
          delete newPending[id];
          return { pendingTransactions: newPending };
        });
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
