import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { parseCSV } from '../../utils/csvParser';
import { guessCategory } from '../../utils/autoCategorize';
import { useTriageStore } from '../../store/useTriageStore';
import { useBudgetStore } from '../../store/useBudgetStore';

export const CSVUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const addPending = useTriageStore((state) => state.addPending);
  const categories = useBudgetStore((state) => state.categories);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      const transactions = await parseCSV(file);
      
      // Auto-categorize
      const categorized = transactions.map(tx => {
        const categoryId = guessCategory(tx.description, categories);
        return {
          ...tx,
          categoryId
        };
      });

      addPending(categorized);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV');
    } finally {
      setIsParsing(false);
    }
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
        className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md text-[14px] font-medium hover:border-[var(--color-accent)] transition-colors disabled:opacity-50"
      >
        <Upload size={16} />
        {isParsing ? 'Parsing...' : 'Import CSV'}
      </button>
      {error && <span className="text-[12px] text-red-500 text-center">{error}</span>}
    </div>
  );
};
