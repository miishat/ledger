export type BudgetingParadigm = 'Ledger Custom' | 'Zero-Based' | 'Target-Based' | '50/30/20';

export type BudgetClass = 'need' | 'want' | 'savings';

export interface CategoryGroup {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  /** 50/30/20 bucket for expense groups. Unclassified counts as need. */
  budgetClass?: BudgetClass;
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
  /** Shared bill: amount is YOUR share; totalAmount is what you actually paid.
   *  The difference is owed to you by sharedWith. */
  shared?: { totalAmount: number; sharedWith: string };
  /** Income that pays back a shared bill; excluded from income totals. */
  reimbursement?: { from: string };
}

export interface Reallocation {
  id: string;
  fromCategoryId: string;
  toCategoryId: string;
  amount: number;
  date: string;
  note?: string;
}
