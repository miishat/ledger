export interface TriageTransaction {
  id: string; // Temporary UUID for triage
  date: string; // YYYY-MM-DD
  amount: number; // Absolute value
  categoryId?: string; // Guessed or selected category
  description: string;
  type: 'expense' | 'income';
  originalRowData?: Record<string, string>; // The raw CSV row
}

export interface BankParserConfig {
  name: string;
  // Function to detect if a CSV matches this parser based on header names
  detect: (headers: string[]) => boolean;
  // Function to map a raw row into the base fields of a TriageTransaction
  parse: (row: Record<string, string>) => Omit<TriageTransaction, 'id' | 'categoryId'> | null;
}
