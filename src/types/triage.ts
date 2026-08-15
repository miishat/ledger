export interface TriageTransaction {
  id: string; // Temporary UUID for triage
  date: string; // YYYY-MM-DD
  amount: number; // Absolute value
  categoryId?: string; // Guessed or selected category
  description: string;
  type: 'expense' | 'income';
  originalRowData?: Record<string, string>; // The raw CSV row
  /** Set at import time when this row looks like something already in the
   *  budget. 'exact' means same date, amount, direction and description;
   *  'possible' means same date, amount and direction only. */
  duplicate?: 'exact' | 'possible';
}

export interface BankParserConfig {
  name: string;
  // Function to detect if a CSV matches this parser based on header names
  detect: (headers: string[]) => boolean;
  // Function to map a raw row into the base fields of a TriageTransaction
  parse: (row: Record<string, string>) => Omit<TriageTransaction, 'id' | 'categoryId'> | null;
}
