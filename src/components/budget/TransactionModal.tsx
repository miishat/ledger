import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useBudgetStore } from '../../store/useBudgetStore';
import { ThemedSelect } from '../ui/ThemedSelect';
import { ThemedDatePicker } from '../ui/ThemedDatePicker';
import { NumberInput } from '../ui/NumberInput';
import { Sheet } from '../ui/Sheet';

import type { Transaction } from '../../types/budget';

export type TransactionType = 'expense' | 'income';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

export function TransactionModal({ isOpen, onClose, initialTransaction }: TransactionModalProps) {
  const addTransaction = useBudgetStore((state) => state.addTransaction);
  const updateTransaction = useBudgetStore((state) => state.updateTransaction);
  const deleteTransaction = useBudgetStore((state) => state.deleteTransaction);
  const categories = useBudgetStore((state) => state.categories);
  const categoryGroups = useBudgetStore((state) => state.categoryGroups);

  const [type, setType] = useState<TransactionType>('expense');

  const categoryList = Object.values(categories).filter((cat) => {
    const group = categoryGroups[cat.groupId];
    return (group?.kind ?? 'expense') === type;
  });

  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');

  React.useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(initialTransaction.amount);
      setCategory(initialTransaction.categoryId || '');
      setDate(initialTransaction.date);
      setDescription(initialTransaction.description || '');
    } else {
      setType('expense');
      setAmount(0);
      setCategory(categoryList.length > 0 ? categoryList[0].id : '');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
  }, [initialTransaction, isOpen, categories]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const nextCategoryList = Object.values(categories).filter((cat) => {
      const group = categoryGroups[cat.groupId];
      return (group?.kind ?? 'expense') === nextType;
    });
    setCategory((current) => {
      if (current && !nextCategoryList.some((c) => c.id === current)) {
        return nextCategoryList[0]?.id ?? '';
      }
      return current;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    if (initialTransaction) {
      updateTransaction(initialTransaction.id, {
        type,
        amount,
        categoryId: category,
        date,
        description
      });
    } else {
      addTransaction({
        id: crypto.randomUUID(),
        type,
        amount,
        categoryId: category,
        date,
        description
      });
    }

    // Reset form
    setType('expense');
    setAmount(0);
    setCategory(categoryList.length > 0 ? categoryList[0].id : '');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    onClose();
  };

  const handleDelete = () => {
    if (initialTransaction) {
      deleteTransaction(initialTransaction.id);
      onClose();
    }
  };

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      desktop="modal"
      ariaLabel={initialTransaction ? 'Edit Transaction' : 'Add Transaction'}
      panelClassName="w-full max-w-md bg-[var(--color-bg-primary)] rounded-xl shadow-lg border border-[var(--color-border)] overflow-hidden"
    >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-[18px] font-semibold leading-[1.2] text-[var(--color-text-primary)]">
            {initialTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          {/* Type Toggle */}
          <div className="flex rounded-md overflow-hidden border border-[var(--color-border)]">
            <button
              type="button"
              className={`flex-1 py-2 text-[14px] font-medium transition-colors ${
                type === 'expense'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              onClick={() => handleTypeChange('expense')}
            >
              Expense
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-[14px] font-medium transition-colors ${
                type === 'income'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              onClick={() => handleTypeChange('income')}
            >
              Income
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium leading-none text-[var(--color-text-secondary)]">
              Amount
            </label>
            <NumberInput
              value={amount}
              onCommit={setAmount}
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              placeholder="0.00"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium leading-none text-[var(--color-text-secondary)]">
              Category
            </label>
            <ThemedSelect
              value={category}
              onChange={(v) => setCategory(v)}
              options={[
                { value: '', label: 'Uncategorized' },
                ...categoryList.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium leading-none text-[var(--color-text-secondary)]">
              Date
            </label>
            <ThemedDatePicker
              value={date}
              onChange={setDate}
              className="bg-[var(--color-bg-secondary)] border-[var(--color-border)] rounded-md text-[14px] focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium leading-none text-[var(--color-text-secondary)]">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              placeholder="e.g. Groceries at Trader Joe's"
            />
          </div>

          <div className="pt-2 mt-2 border-t border-[var(--color-border)] flex gap-2">
            {initialTransaction && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-3 bg-error/10 text-error rounded-md text-[14px] font-medium hover:bg-error/20 transition-colors"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              {initialTransaction ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
    </Sheet>
  );
}
