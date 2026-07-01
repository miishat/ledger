import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import type { TriageTransaction } from '../types/triage';

export interface UnrecognizedCSVResult {
  unrecognized: true;
  headers: string[];
  rows: any[];
}

export interface BankParserConfig {
  name: string;
  detect: (headers: string[], firstRow: any) => boolean;
  parse: (row: any) => Omit<TriageTransaction, 'id' | 'categoryId'> | null;
}

export const PARSERS: BankParserConfig[] = [
  {
    name: 'Preferred Package',
    // Headers: Filter,Date,Description,Sub-description,Type of Transaction,Amount,Balance
    detect: (headers) => headers.includes('Sub-description') && headers.includes('Type of Transaction'),
    parse: (row) => {
      const amountRaw = parseFloat(row['Amount']);
      if (isNaN(amountRaw)) return null;
      
      const type = row['Type of Transaction'] === 'Credit' ? 'income' : 'expense';
      const amount = Math.abs(amountRaw);
      
      // Date is already YYYY-MM-DD in the example
      const date = row['Date'];
      
      // Combine Description and Sub-description
      const desc1 = row['Description']?.trim() || '';
      const desc2 = row['Sub-description']?.trim() || '';
      const description = [desc1, desc2].filter(Boolean).join(' - ');

      return { date, amount, description, type, originalRowData: row };
    }
  },
  {
    name: 'Account Activity (Headerless)',
    // It's headerless, so PapaParse gives us an array of strings for each row
    detect: (_headers, firstRow) => {
      // If it's headerless, firstRow is an array
      if (!Array.isArray(firstRow)) return false;
      // Check if first element is a date like MM/DD/YYYY
      return /^\d{2}\/\d{2}\/\d{4}$/.test(firstRow[0]);
    },
    parse: (row: string[]) => {
      if (!Array.isArray(row) || row.length < 5) return null;
      
      // row[0]: Date, row[1]: Description, row[2]: Expense, row[3]: Income
      let date = row[0];
      if (date && date.includes('/')) {
        const [m, d, y] = date.split('/');
        date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }

      const expense = parseFloat(row[2]);
      const income = parseFloat(row[3]);

      let amount = 0;
      let type: 'income' | 'expense' = 'expense';

      if (!isNaN(expense)) {
        amount = expense;
        type = 'expense';
      } else if (!isNaN(income)) {
        amount = income;
        type = 'income';
      } else {
        return null;
      }

      // Convert array row to Record<string, string> to satisfy TriageTransaction types
      const originalRowData = Object.fromEntries(row.map((val, i) => [String(i), val]));

      return { date, amount, description: row[1]?.trim() || 'Unknown', type, originalRowData };
    }
  },
  {
    name: 'Download Transactions (Visa)',
    // Headers: Account Type,Account Number,Transaction Date,Cheque Number,Description 1,Description 2,CAD$,USD$
    detect: (headers) => headers.includes('Transaction Date') && headers.includes('CAD$'),
    parse: (row) => {
      const amountRaw = parseFloat(row['CAD$']);
      if (isNaN(amountRaw)) return null;
      
      // Negative is expense, positive is income
      const type = amountRaw > 0 ? 'income' : 'expense';
      const amount = Math.abs(amountRaw);
      
      let date = row['Transaction Date'];
      if (date && date.includes('/')) {
        const [m, d, y] = date.split('/');
        date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }

      return { date, amount, description: row['Description 1']?.trim() || 'Unknown', type, originalRowData: row };
    }
  },
  {
    name: 'Standard Ledger CSV',
    detect: (headers) => headers.includes('Date') && headers.includes('Amount') && headers.includes('Description'),
    parse: (row) => {
      const amountRaw = parseFloat(row['Amount']);
      if (isNaN(amountRaw)) return null;
      
      const type = amountRaw >= 0 ? 'income' : 'expense';
      const amount = Math.abs(amountRaw);
      
      return {
        date: row['Date'],
        amount,
        description: row['Description'],
        type,
        originalRowData: row
      };
    }
  }
];

export async function parseCSV(file: File): Promise<TriageTransaction[] | UnrecognizedCSVResult> {
  const text = await file.text();
  const firstLine = text.split('\n')[0].trim();
  
  // Detect headerless format: starts with MM/DD/YYYY
  const isHeaderless = /^\d{2}\/\d{2}\/\d{4},/.test(firstLine);

  return new Promise((resolve, reject) => {
    Papa.parse<any>(file, {
      header: !isHeaderless,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = isHeaderless ? [] : (results.meta.fields || []);
        const firstRow = results.data[0];
        
        const parser = PARSERS.find(p => p.detect(headers, firstRow));
        
        if (!parser) {
          resolve({
            unrecognized: true,
            headers: isHeaderless ? firstRow.map((_: any, i: number) => `Column ${i + 1}`) : headers,
            rows: results.data
          });
          return;
        }

        const transactions: TriageTransaction[] = [];
        for (const row of results.data) {
          const parsed = parser.parse(row);
          if (parsed) {
            transactions.push({
              ...parsed,
              id: uuidv4()
            });
          }
        }
        
        resolve(transactions);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}
