import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { parseCSV, type UnrecognizedCSVResult } from '../../utils/csvParser';
import { guessCategory } from '../../utils/autoCategorize';
import { chaseCategoryId } from '../../utils/budget/chaseCategoryMap';
import { classifyDuplicates } from '../../utils/budget/importDedupe';
import { useTriageStore } from '../../store/useTriageStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { v4 as uuidv4 } from 'uuid';
import type { TriageTransaction } from '../../types/triage';
import { ThemedSelect } from '../ui/ThemedSelect';
import { Sheet } from '../ui/Sheet';

export const CSVUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [mappingData, setMappingData] = useState<UnrecognizedCSVResult | null>(null);
  const [mapDate, setMapDate] = useState<string>('');
  const [mapAmount, setMapAmount] = useState<string>('');
  const [mapDesc, setMapDesc] = useState<string>('');

  const addPending = useTriageStore((state) => state.addPending);
  const categoryRules = useTriageStore((state) => state.categoryRules);
  const categories = useBudgetStore((state) => state.categories);

  const handleTransactions = (transactions: TriageTransaction[]) => {
    // Auto-categorize
    const categorized = transactions.map(tx => {
      // The user's own learned rules are deliberate, so they win. Chase's own
      // category column is consulted only where no rule matched.
      const categoryId =
        guessCategory(tx.description, categories, categoryRules) ??
        chaseCategoryId(tx.originalRowData?.['Category'], categories);
      return {
        ...tx,
        categoryId
      };
    });
    // Compare against what is already in the budget AND what is already waiting
    // in triage, so importing the same file twice flags the second copy.
    const existing = [
      ...Object.values(useBudgetStore.getState().transactions),
      ...Object.values(useTriageStore.getState().pendingTransactions).map((p) => ({
        id: p.id, date: p.date, amount: p.amount, description: p.description, type: p.type,
      })),
    ];
    const verdicts = classifyDuplicates(categorized, existing);
    addPending(categorized.map((tx) => (verdicts[tx.id] ? { ...tx, duplicate: verdicts[tx.id] } : tx)));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      const result = await parseCSV(file);
      
      if ('unrecognized' in result && result.unrecognized) {
        setMappingData(result as UnrecognizedCSVResult);
      } else {
        handleTransactions(result as TriageTransaction[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMappingSubmit = () => {
    if (!mappingData || !mapDate || !mapAmount || !mapDesc) return;
    
    const transactions: TriageTransaction[] = [];
    
    mappingData.rows.forEach(row => {
      const getVal = (header: string) => {
        const idx = mappingData.headers.indexOf(header);
        return Array.isArray(row) ? row[idx] : row[header];
      };

      const dateRaw = getVal(mapDate);
      const amountRawStr = getVal(mapAmount);
      const descRaw = getVal(mapDesc);

      if (!dateRaw || !amountRawStr) return;

      const amountRaw = parseFloat(String(amountRawStr).replace(/[^0-9.-]+/g,""));
      if (isNaN(amountRaw)) return;
      
      const type = amountRaw >= 0 ? 'income' : 'expense';
      const amount = Math.abs(amountRaw);
      
      let date = String(dateRaw);
      if (date && date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3) {
          const [m, d, y] = parts;
          date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }

      transactions.push({
        id: uuidv4(),
        date,
        amount,
        description: String(descRaw || '').trim(),
        type,
        originalRowData: Array.isArray(row) ? Object.fromEntries(row.map((val, i) => [String(i), val])) : row
      });
    });

    handleTransactions(transactions);
    setMappingData(null);
    setMapDate('');
    setMapAmount('');
    setMapDesc('');
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isParsing}
        aria-label="Import CSV"
        className="flex items-center justify-center gap-2 h-10 px-4 bg-[var(--color-bg-secondary)] border control-border rounded-md text-[14px] font-medium hover:border-[var(--color-accent)] transition-colors disabled:opacity-50"
      >
        <Upload size={16} />
        <span className="hidden sm:inline">{isParsing ? 'Parsing...' : 'Import CSV'}</span>
      </button>
      {error && <span className="text-[12px] text-error text-center">{error}</span>}

      <Sheet
        open={!!mappingData}
        onClose={() => setMappingData(null)}
        desktop="modal"
        ariaLabel="Map CSV Columns"
        title="Map CSV Columns"
        panelClassName="bg-[var(--color-bg-primary)] desktop:p-6 desktop:rounded-lg w-full desktop:w-[400px] border border-[var(--color-border)] shadow-xl"
        contentClassName="flex flex-col gap-4"
      >
        {mappingData && (
          <>
            <div className="hidden desktop:flex justify-between items-center">
              <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Map CSV Columns</h2>
              <button onClick={() => setMappingData(null)} aria-label="Close" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"><X size={20} /></button>
            </div>
            <p className="text-[14px] text-[var(--color-text-secondary)]">We couldn't recognize this CSV format. Please select the correct columns.</p>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[var(--color-text-primary)]">Date Column</label>
                <ThemedSelect
                  value={mapDate}
                  onChange={setMapDate}
                  options={[{ value: '', label: 'Select...' }, ...mappingData.headers.map(h => ({ value: h, label: h }))]}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[var(--color-text-primary)]">Amount Column</label>
                <ThemedSelect
                  value={mapAmount}
                  onChange={setMapAmount}
                  options={[{ value: '', label: 'Select...' }, ...mappingData.headers.map(h => ({ value: h, label: h }))]}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[var(--color-text-primary)]">Description Column</label>
                <ThemedSelect
                  value={mapDesc}
                  onChange={setMapDesc}
                  options={[{ value: '', label: 'Select...' }, ...mappingData.headers.map(h => ({ value: h, label: h }))]}
                />
              </div>
            </div>

            <button 
              onClick={handleMappingSubmit}
              disabled={!mapDate || !mapAmount || !mapDesc}
              className="mt-2 w-full py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md font-medium disabled:opacity-50 transition-opacity"
            >
              Import Transactions
            </button>
          </>
        )}
      </Sheet>
    </div>
  );
};
