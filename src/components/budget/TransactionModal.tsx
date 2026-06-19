import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useBudgetStore, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../store/useBudgetStore';
import type { TransactionType } from '../../store/useBudgetStore';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const addTransaction = useBudgetStore((state) => state.addTransaction);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    addTransaction({
      type,
      amount: Number(amount),
      category,
      date,
      description
    });

    // Reset form
    setType('expense');
    setAmount('');
    setCategory(EXPENSE_CATEGORIES[0]);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    onClose();
  };

  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-[var(--color-bg-primary)] rounded-xl shadow-lg border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-[18px] font-semibold leading-[1.2] text-[var(--color-text-primary)]">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
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
              onClick={() => {
                setType('expense');
                setCategory(EXPENSE_CATEGORIES[0]);
              }}
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
              onClick={() => {
                setType('income');
                setCategory(INCOME_CATEGORIES[0]);
              }}
            >
              Income
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium leading-none text-[var(--color-text-secondary)]">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              placeholder="0.00"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium leading-none text-[var(--color-text-secondary)]">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
            >
              {currentCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium leading-none text-[var(--color-text-secondary)]">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
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

          <div className="pt-2 mt-2 border-t border-[var(--color-border)]">
            <button
              type="submit"
              className="w-full py-3 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
