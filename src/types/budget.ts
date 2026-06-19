export type BudgetingParadigm = 'Target-Based' | 'Zero-Based' | 'Ledger Custom';

export interface CategoryGroup {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  groupId: string;
  name: string;
  targetAmount: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  categoryId?: string;
  description: string;
  type: 'expense' | 'income';
}

export interface Reallocation {
  id: string;
  fromCategoryId: string;
  toCategoryId: string;
  amount: number;
  date: string;
  note?: string;
}
