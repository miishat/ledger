import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useBudgetStore } from '../../store/useBudgetStore';
import { ThemedSelect } from '../ui/ThemedSelect';
import { ThemedDatePicker } from '../ui/ThemedDatePicker';
import { NumberInput } from '../ui/NumberInput';
import { Sheet } from '../ui/Sheet';
import { Checkbox } from '../ui/Checkbox';
import { formatMoney } from '../planner/format';
import { sharedPeople } from '../../utils/budget/sharedExpenses';
import { splitRemainder, round2 } from '../../utils/budget/splits';

import type { Transaction, TransactionSplit } from '../../types/budget';

export type TransactionType = 'expense' | 'income';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

interface TransactionFormProps {
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

/** Mounted only while the sheet is open, so useState initialisers are the form
 *  reset. Do not reintroduce an effect that sets state here. */
function TransactionForm({ onClose, initialTransaction }: TransactionFormProps) {
  const addTransaction = useBudgetStore((state) => state.addTransaction);
  const updateTransaction = useBudgetStore((state) => state.updateTransaction);
  const deleteTransaction = useBudgetStore((state) => state.deleteTransaction);
  const categories = useBudgetStore((state) => state.categories);
  const categoryGroups = useBudgetStore((state) => state.categoryGroups);
  const transactions = useBudgetStore((state) => state.transactions);

  const [type, setType] = useState<TransactionType>(initialTransaction?.type ?? 'expense');

  const categoryList = Object.values(categories).filter((cat) => {
    const group = categoryGroups[cat.groupId];
    return (group?.kind ?? 'expense') === type;
  });

  const [amount, setAmount] = useState<number>(initialTransaction?.amount ?? 0);
  const [category, setCategory] = useState<string>(
    initialTransaction?.categoryId ?? categoryList[0]?.id ?? '',
  );
  const [date, setDate] = useState<string>(initialTransaction?.date ?? new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>(initialTransaction?.description ?? '');

  const [isShared, setIsShared] = useState(!!initialTransaction?.shared);
  const [totalPaid, setTotalPaid] = useState<number>(initialTransaction?.shared?.totalAmount ?? 0);
  const [sharedWith, setSharedWith] = useState<string>(initialTransaction?.shared?.sharedWith ?? '');
  const [isReimbursement, setIsReimbursement] = useState(!!initialTransaction?.reimbursement);
  const [reimbursementFrom, setReimbursementFrom] = useState<string>(initialTransaction?.reimbursement?.from ?? '');

  const [isSplit, setIsSplit] = useState(!!initialTransaction?.splits?.length);
  const [splits, setSplits] = useState<TransactionSplit[]>(
    initialTransaction?.splits ?? [{ categoryId: category, amount: 0 }],
  );
  const [tagsText, setTagsText] = useState<string>((initialTransaction?.tags ?? []).join(', '));
  const [note, setNote] = useState<string>(initialTransaction?.note ?? '');

  const remaining = splitRemainder(amount, isSplit ? splits : []);

  const peopleSuggestions = React.useMemo(() => sharedPeople(transactions), [transactions]);

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

    const sharedField =
      type === 'expense' && isShared && totalPaid > amount && sharedWith.trim()
        ? { totalAmount: totalPaid, sharedWith: sharedWith.trim() }
        : undefined;
    const reimbursementField =
      type === 'income' && isReimbursement && reimbursementFrom.trim()
        ? { from: reimbursementFrom.trim() }
        : undefined;

    const cleanedSplits = isSplit
      ? splits
          .filter((s) => s.amount > 0)
          .map((s) => ({ categoryId: s.categoryId || undefined, amount: round2(s.amount) }))
      : [];
    const splitsField = cleanedSplits.length > 0 ? cleanedSplits : undefined;

    const tags = Array.from(
      new Set(
        tagsText
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
    const tagsField = tags.length > 0 ? tags : undefined;
    const noteField = note.trim() ? note.trim() : undefined;

    if (initialTransaction) {
      updateTransaction(initialTransaction.id, {
        type,
        amount,
        categoryId: category,
        date,
        description,
        shared: sharedField,
        reimbursement: reimbursementField,
        splits: splitsField,
        tags: tagsField,
        note: noteField
      });
    } else {
      addTransaction({
        id: crypto.randomUUID(),
        type,
        amount,
        categoryId: category,
        date,
        description,
        shared: sharedField,
        reimbursement: reimbursementField,
        splits: splitsField,
        tags: tagsField,
        note: noteField
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (initialTransaction) {
      deleteTransaction(initialTransaction.id);
      onClose();
    }
  };

  return (
    <>
        <div className="hidden md:flex items-center justify-between p-4 border-b border-[var(--color-border)]">
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
            <label htmlFor="tx-amount" className="text-[12px] font-medium leading-none text-[var(--color-text-secondary)]">
              Amount
            </label>
            <NumberInput
              id="tx-amount"
              value={amount}
              onCommit={setAmount}
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              placeholder="0.00"
            />
          </div>

          {type === 'expense' && (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[12px] font-medium text-[var(--color-text-secondary)]">
                <Checkbox checked={isShared} onChange={setIsShared} ariaLabel="Shared bill" />
                Shared bill (I paid for others too)
              </label>
              {isShared && (
                <div className="flex flex-col gap-2 pl-1 border-l-2 border-[var(--color-border)] ml-1">
                  <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">Total I paid</label>
                  <NumberInput
                    value={totalPaid}
                    onCommit={setTotalPaid}
                    className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                    placeholder="0.00"
                  />
                  <div className="flex gap-2">
                    {[0.5, 1 / 3, 0.25].map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAmount(Math.round(totalPaid * f * 100) / 100)}
                        className="px-2 py-1 rounded-md text-[12px] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
                      >
                        My share {['50%', '33%', '25%'][i]}
                      </button>
                    ))}
                  </div>
                  <p className="text-meta text-[var(--color-text-secondary)]">
                    Amount above is your share; the rest ({formatMoney(Math.max(0, totalPaid - amount))}) is owed to you.
                  </p>
                  <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">Shared with</label>
                  <input
                    type="text"
                    list="shared-people"
                    value={sharedWith}
                    onChange={(e) => setSharedWith(e.target.value)}
                    className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                    placeholder="e.g. Alex, roommates"
                  />
                </div>
              )}
            </div>
          )}
          {type === 'income' && (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[12px] font-medium text-[var(--color-text-secondary)]">
                <Checkbox checked={isReimbursement} onChange={setIsReimbursement} ariaLabel="Reimbursement for a shared bill" />
                Reimbursement for a shared bill (not income)
              </label>
              {isReimbursement && (
                <input
                  type="text"
                  list="shared-people"
                  value={reimbursementFrom}
                  onChange={(e) => setReimbursementFrom(e.target.value)}
                  className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                  placeholder="Who paid you back?"
                />
              )}
            </div>
          )}
          <datalist id="shared-people">
            {peopleSuggestions.map((p) => <option key={p} value={p} />)}
          </datalist>

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
            <label className="flex items-center gap-2 text-[12px] font-medium text-[var(--color-text-secondary)]">
              <Checkbox checked={isSplit} onChange={setIsSplit} ariaLabel="Split across categories" />
              Split across categories
            </label>
            {isSplit && (
              <div className="flex flex-col gap-2 pl-1 border-l-2 border-[var(--color-border)] ml-1">
                {splits.map((slice, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ThemedSelect
                      ariaLabel="Slice category"
                      value={slice.categoryId ?? ''}
                      onChange={(v) =>
                        setSplits((cur) => cur.map((s, j) => (j === i ? { ...s, categoryId: v } : s)))
                      }
                      className="flex-1 text-[12px]"
                      options={[
                        { value: '', label: 'Uncategorized' },
                        ...categoryList.map((cat) => ({ value: cat.id, label: cat.name })),
                      ]}
                    />
                    <NumberInput
                      value={slice.amount}
                      onCommit={(v) =>
                        setSplits((cur) => cur.map((s, j) => (j === i ? { ...s, amount: v } : s)))
                      }
                      ariaLabel="Slice amount"
                      className="w-28 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                      placeholder="0.00"
                    />
                    <button
                      type="button"
                      aria-label="Remove slice"
                      onClick={() => setSplits((cur) => cur.filter((_, j) => j !== i))}
                      className="p-2 text-[var(--color-text-secondary)] hover:text-error rounded-md"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSplits((cur) => [...cur, { categoryId: '', amount: 0 }])}
                  className="self-start px-2 py-1 rounded-md text-[12px] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
                >
                  Add a slice
                </button>
                <p className="text-meta text-[var(--color-text-secondary)]">
                  {remaining > 0
                    ? `${formatMoney(remaining)} left to allocate, which stays on the category above.`
                    : remaining < 0
                      ? `Slices exceed the amount by ${formatMoney(Math.abs(remaining))}.`
                      : 'Fully allocated.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tx-tags" className="text-[12px] font-medium leading-none text-[var(--color-text-secondary)]">
              Tags
            </label>
            <input
              id="tx-tags"
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              placeholder="Comma separated, e.g. trip, reimbursable"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tx-note" className="text-[12px] font-medium leading-none text-[var(--color-text-secondary)]">
              Note
            </label>
            <textarea
              id="tx-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              placeholder="Anything you want to remember about this one"
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
            <label htmlFor="tx-description" className="text-[12px] font-medium leading-none text-[var(--color-text-secondary)]">
              Description (Optional)
            </label>
            <input
              id="tx-description"
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
    </>
  );
}

export function TransactionModal({ isOpen, onClose, initialTransaction }: TransactionModalProps) {
  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      desktop="modal"
      ariaLabel={initialTransaction ? 'Edit Transaction' : 'Add Transaction'}
      title={initialTransaction ? 'Edit Transaction' : 'Add Transaction'}
      panelClassName="w-full max-w-md bg-[var(--color-bg-primary)] md:rounded-xl shadow-lg border border-[var(--color-border)] md:overflow-hidden"
    >
      <TransactionForm key={initialTransaction?.id ?? 'new'} onClose={onClose} initialTransaction={initialTransaction} />
    </Sheet>
  );
}
