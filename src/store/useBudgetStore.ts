import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BudgetingParadigm,
  Category,
  CategoryGroup,
  Reallocation,
  Transaction,
} from '../types/budget';

interface BudgetState {
  paradigm: BudgetingParadigm;
  transactions: Record<string, Transaction>;
  categories: Record<string, Category>;
  categoryGroups: Record<string, CategoryGroup>;
  reallocations: Record<string, Reallocation>;

  setParadigm: (paradigm: BudgetingParadigm) => void;
  
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addCategoryGroup: (group: CategoryGroup) => void;
  updateCategoryGroup: (id: string, updates: Partial<CategoryGroup>) => void;
  deleteCategoryGroup: (id: string) => void;

  addReallocation: (reallocation: Reallocation) => void;
  deleteReallocation: (id: string) => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      paradigm: 'Ledger Custom',
      transactions: {},
      categories: {},
      categoryGroups: {},
      reallocations: {},

      setParadigm: (paradigm) => set({ paradigm }),

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: { ...state.transactions, [transaction.id]: transaction },
        })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: {
            ...state.transactions,
            [id]: { ...state.transactions[id], ...updates },
          },
        })),
      deleteTransaction: (id) =>
        set((state) => {
          const newTransactions = { ...state.transactions };
          delete newTransactions[id];
          return { transactions: newTransactions };
        }),

      addCategory: (category) =>
        set((state) => ({
          categories: { ...state.categories, [category.id]: category },
        })),
      updateCategory: (id, updates) =>
        set((state) => ({
          categories: {
            ...state.categories,
            [id]: { ...state.categories[id], ...updates },
          },
        })),
      deleteCategory: (id) =>
        set((state) => {
          const newCategories = { ...state.categories };
          delete newCategories[id];
          return { categories: newCategories };
        }),

      addCategoryGroup: (group) =>
        set((state) => ({
          categoryGroups: { ...state.categoryGroups, [group.id]: group },
        })),
      updateCategoryGroup: (id, updates) =>
        set((state) => ({
          categoryGroups: {
            ...state.categoryGroups,
            [id]: { ...state.categoryGroups[id], ...updates },
          },
        })),
      deleteCategoryGroup: (id) =>
        set((state) => {
          const newGroups = { ...state.categoryGroups };
          delete newGroups[id];
          return { categoryGroups: newGroups };
        }),

      addReallocation: (reallocation) =>
        set((state) => ({
          reallocations: { ...state.reallocations, [reallocation.id]: reallocation },
        })),
      deleteReallocation: (id) =>
        set((state) => {
          const newReallocations = { ...state.reallocations };
          delete newReallocations[id];
          return { reallocations: newReallocations };
        }),
    }),
    {
      name: 'ledger-budget',
    }
  )
);

// Dynamic computation selectors

export interface MonthlyBudgetStats {
  spent: number;
  remaining: number;
  unallocated: number;
}

export function getMonthlyBudgetStats(
  state: BudgetState,
  year: number,
  monthIndex: number // 0-11
): MonthlyBudgetStats {
  let spent = 0;
  let totalIncome = 0;
  
  // Calculate total spent and income for the month
  Object.values(state.transactions).forEach((tx) => {
    const date = new Date(tx.date);
    if (date.getFullYear() === year && date.getMonth() === monthIndex) {
      if (tx.type === 'expense') {
        spent += tx.amount;
      } else if (tx.type === 'income') {
        totalIncome += tx.amount;
      }
    }
  });

  // Calculate total targets
  const totalTarget = Object.values(state.categories).reduce(
    (sum, cat) => sum + cat.targetAmount,
    0
  );

  return {
    spent,
    remaining: totalTarget - spent,
    unallocated: totalIncome - totalTarget,
  };
}
