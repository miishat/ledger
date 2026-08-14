import React, { useState } from 'react';
import { useBudgetStore } from '../../store/useBudgetStore';
import { TransactionModal } from './TransactionModal';
import type { Transaction } from '../../types/budget';
import { Trash2, Maximize2, Minimize2, Receipt, Search } from 'lucide-react';
import { ThemedSelect } from '../ui/ThemedSelect';
import { formatMoney } from '../planner/format';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { inRange, type MonthRange } from '../../utils/budget/period';

interface TransactionListWidgetProps {
  range: MonthRange;
}

export const TransactionListWidget: React.FC<TransactionListWidgetProps> = ({ range }) => {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const deleteTransaction = useBudgetStore((state) => state.deleteTransaction);
  const clearAllTransactions = useBudgetStore((state) => state.clearAllTransactions);
  const setTransactionsCategory = useBudgetStore((state) => state.setTransactionsCategory);
  const deleteTransactions = useBudgetStore((state) => state.deleteTransactions);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  const needle = query.trim().toLowerCase();
  const txList = Object.values(transactions)
    .filter(tx => inRange(tx.date, range))
    .filter(tx => {
      if (selectedCategoryId === '') return true;
      if (selectedCategoryId === 'uncategorized') return !tx.categoryId;
      return tx.categoryId === selectedCategoryId;
    })
    .filter(tx => {
      if (!needle) return true;
      const categoryName = tx.categoryId ? categories[tx.categoryId]?.name ?? '' : '';
      return (
        tx.description.toLowerCase().includes(needle) ||
        categoryName.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Selection is scoped to what is currently visible: narrowing the search must
  // not leave invisible rows armed for deletion.
  const visibleIds = txList.map((tx) => tx.id);
  const selected = selectedIds.filter((id) => visibleIds.includes(id));
  const allVisibleSelected = visibleIds.length > 0 && selected.length === visibleIds.length;

  const toggleRow = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const toggleAll = () => setSelectedIds(allVisibleSelected ? [] : visibleIds);

  const getTransactionDisplay = (tx: Transaction) => ({
    amountClass: tx.type === 'income' ? 'text-accent' : 'text-text-primary',
    amountPrefix: tx.type === 'income' ? '+' : '-',
    categoryLabel: tx.categoryId ? categories[tx.categoryId]?.name || 'Unknown' : 'Uncategorized',
    badge: tx.shared
      ? `shared · ${tx.shared.sharedWith}`
      : tx.reimbursement
        ? `reimb · ${tx.reimbursement.from}`
        : null,
  });

  const wrapperClass = isExpanded
    ? "fixed inset-4 z-50 bg-bg-secondary border border-border rounded-xl p-6 flex flex-col shadow-2xl animate-fade-in"
    : "mt-8 bg-bg-secondary border border-border rounded-xl p-6 flex flex-col min-h-[300px]";

  return (
    <div className={wrapperClass}>
      <div className="flex flex-wrap justify-between items-center gap-y-2 mb-4 border-b border-border pb-4">
        <h2 className="text-[18px] font-semibold text-text-primary">All Transactions</h2>
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="relative">
            <Search size={14} aria-hidden="true" className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search transactions"
              placeholder="Search"
              className="h-[34px] w-40 sm:w-48 pl-7 pr-2 text-[13px] bg-bg-primary border border-border rounded-md text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent shadow-sm"
            />
          </div>
          <ThemedSelect
            value={selectedCategoryId}
            onChange={setSelectedCategoryId}
            className="text-[13px] shadow-sm"
            options={[
              { value: '', label: 'All Categories' },
              { value: 'uncategorized', label: 'Uncategorized' },
              ...Object.values(categories).map(c => ({ value: c.id, label: c.name })),
            ]}
          />
          {txList.length > 0 && (
            <button
              onClick={() => setConfirmClearOpen(true)}
              className="text-[13px] text-error hover:text-error/80 transition-colors border border-error/30 hover:bg-error/10 px-2 py-1.5 rounded-md flex items-center gap-1 shadow-sm"
              title="Clear All Transactions"
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors bg-bg-primary rounded border border-border shadow-sm ml-2"
            title={isExpanded ? "Minimize" : "Expand to Full Screen"}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg border border-accent/40 bg-accent/10">
          <span className="text-[13px] font-medium text-text-primary">{selected.length} selected</span>
          <ThemedSelect
            ariaLabel="Category for selected"
            value={bulkCategoryId}
            onChange={setBulkCategoryId}
            className="text-[13px]"
            options={[
              { value: '', label: 'Choose a category' },
              ...Object.values(categories).map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <button
            onClick={() => {
              if (!bulkCategoryId) return;
              setTransactionsCategory(selected, bulkCategoryId);
              setSelectedIds([]);
              setBulkCategoryId('');
            }}
            disabled={!bulkCategoryId}
            className="text-[13px] px-3 py-1.5 rounded-md bg-accent text-[var(--color-bg-primary)] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
          <button
            onClick={() => setConfirmBulkDeleteOpen(true)}
            className="text-[13px] px-3 py-1.5 rounded-md border border-error/40 text-error hover:bg-error/10"
          >
            Delete selected
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-[13px] px-2 py-1.5 rounded-md text-text-secondary hover:text-text-primary ml-auto"
          >
            Clear
          </button>
        </div>
      )}
      {txList.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          {needle || selectedCategoryId ? (
            <EmptyState
              icon={Search}
              message="No matching transactions"
              hint="Try a different search or clear the category filter."
            />
          ) : (
            <EmptyState icon={Receipt} message="No transactions yet" hint="Import a CSV or add one manually to see it here." />
          )}
        </div>
      ) : (
        <div className={`overflow-x-auto ${isExpanded ? 'flex-1 overflow-y-auto' : ''}`}>
          <div className="hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[12px] text-text-secondary">
                  <th className="pb-2 font-medium w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all transactions"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      className="accent-[var(--color-accent)]"
                    />
                  </th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {txList.map(tx => {
                  const { amountClass, amountPrefix, categoryLabel, badge } = getTransactionDisplay(tx);
                  return (
                  <tr
                    key={tx.id}
                    className="border-b border-border/50 hover:bg-bg-primary/50 transition-colors group cursor-pointer"
                    onClick={() => setEditingTransaction(tx)}
                  >
                    <td className="py-3 w-8" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Select transaction"
                        checked={selected.includes(tx.id)}
                        onChange={() => toggleRow(tx.id)}
                        className="accent-[var(--color-accent)]"
                      />
                    </td>
                    <td className="py-3 text-[14px] whitespace-nowrap">{tx.date}</td>
                    <td className="py-3 text-[14px]">{tx.description}</td>
                    <td className="py-3 text-[14px]">
                      <span className="px-2 py-1 bg-bg-primary border border-border rounded-md text-[12px]">
                        {categoryLabel}
                      </span>
                      {badge && (
                        <span className="ml-1 px-2 py-1 bg-accent/10 text-accent rounded-md text-[12px]">{badge}</span>
                      )}
                    </td>
                    <td className={`py-3 text-[14px] font-medium text-right ${amountClass}`}>
                      {amountPrefix}{formatMoney(tx.amount)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTransaction(tx.id);
                        }}
                        aria-label="Delete transaction"
                        className="p-2 text-text-secondary hover:text-error sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-md hover:bg-bg-primary"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div data-testid="transactions-cards" className="md:hidden flex flex-col gap-3">
            {txList.map(tx => {
              const { amountClass, amountPrefix, categoryLabel, badge } = getTransactionDisplay(tx);
              return (
              <div
                key={tx.id}
                data-testid={`transaction-card-${tx.id}`}
                onClick={() => setEditingTransaction(tx)}
                className="themed-card rounded-lg p-3 flex flex-col gap-2 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <input
                    type="checkbox"
                    aria-label="Select transaction"
                    checked={selected.includes(tx.id)}
                    onChange={() => toggleRow(tx.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 shrink-0 accent-[var(--color-accent)]"
                  />
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="text-[14px] font-medium text-text-primary truncate">{tx.description}</span>
                    <span className={`text-[14px] font-medium tabular-nums whitespace-nowrap ml-2 ${amountClass}`}>
                      {amountPrefix}{formatMoney(tx.amount)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTransaction(tx.id);
                    }}
                    aria-label="Delete transaction"
                    className="p-3 -m-1 text-text-secondary hover:text-error transition-colors rounded-md hover:bg-bg-primary shrink-0"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[12px] text-text-secondary">
                  <span>{tx.date}</span>
                  <span className="flex items-center">
                    <span className="px-2 py-1 bg-bg-primary border border-border rounded-md">
                      {categoryLabel}
                    </span>
                    {badge && (
                      <span className="ml-1 px-2 py-1 bg-accent/10 text-accent rounded-md text-[12px]">{badge}</span>
                    )}
                  </span>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      <TransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        initialTransaction={editingTransaction}
      />

      <ConfirmDialog
        open={confirmClearOpen}
        title="Clear all transactions?"
        message="Every transaction will be deleted. This cannot be undone."
        confirmLabel="Clear All"
        tone="danger"
        onConfirm={() => {
          clearAllTransactions();
          setConfirmClearOpen(false);
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />

      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        title={`Delete ${selected.length} transaction${selected.length === 1 ? '' : 's'}?`}
        message="The selected transactions will be removed. You can undo this straight afterwards."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => {
          deleteTransactions(selected);
          setSelectedIds([]);
          setConfirmBulkDeleteOpen(false);
        }}
        onCancel={() => setConfirmBulkDeleteOpen(false)}
      />
    </div>
  );
};
