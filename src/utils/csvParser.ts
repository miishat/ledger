import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import type { TriageTransaction, BankParserConfig } from '../types/triage';

// Define standard parsers here. We can easily add more bank-specific parsers later.
export const PARSERS: BankParserConfig[] = [
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
  },
  {
    name: 'Chase Credit Card',
    detect: (headers) => headers.includes('Transaction Date') && headers.includes('Description') && headers.includes('Amount'),
    parse: (row) => {
      const amountRaw = parseFloat(row['Amount']);
      if (isNaN(amountRaw)) return null;
      
      // Chase Credit Cards usually show purchases as negative, payments as positive.
      const type = amountRaw > 0 ? 'income' : 'expense';
      const amount = Math.abs(amountRaw);
      
      // Convert MM/DD/YYYY to YYYY-MM-DD
      let date = row['Transaction Date'];
      if (date && date.includes('/')) {
        const [m, d, y] = date.split('/');
        date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      
      return {
        date,
        amount,
        description: row['Description'],
        type,
        originalRowData: row
      };
    }
  }
];

export async function parseCSV(file: File): Promise<TriageTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const parser = PARSERS.find(p => p.detect(headers));
        
        if (!parser) {
          reject(new Error(`Unrecognized CSV format. Headers found: ${headers.join(', ')}`));
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
