import { create } from 'zustand';

export type TransactionType = 'income' | 'expense';

export const EXPENSE_CATEGORIES = [
  'Housing',
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Other',
] as const;

export const INCOME_CATEGORIES = [
  'Salary',
  'Investment',
  'Other',
] as const;

export type Category = typeof EXPENSE_CATEGORIES[number] | typeof INCOME_CATEGORIES[number] | string;

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  date: string; // ISO format YYYY-MM-DD
  description?: string;
}

interface BudgetState {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  transactions: [],
  addTransaction: (transaction) => set((state) => ({
    transactions: [
      ...state.transactions,
      { ...transaction, id: crypto.randomUUID() }
    ]
  })),
  deleteTransaction: (id) => set((state) => ({
    transactions: state.transactions.filter(t => t.id !== id)
  }))
}));
