import React, { useEffect, useRef, useState } from 'react';
import { useBudgetStore } from '../../store/useBudgetStore';
import { computeWindow } from '../../utils/virtualWindow';
import { TransactionModal } from './TransactionModal';
import type { Transaction } from '../../types/budget';
import { Trash2, Maximize2, Minimize2, Receipt, Search } from 'lucide-react';
import { ThemedSelect } from '../ui/ThemedSelect';
import { formatMoney } from '../planner/format';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Checkbox } from '../ui/Checkbox';
import { inRange, type MonthRange } from '../../utils/budget/period';
import { useUndoStore } from '../../store/useUndoStore';

interface TransactionListWidgetProps {
  range: MonthRange;
}

export const TransactionListWidget: React.FC<TransactionListWidgetProps> = ({ range }) => {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const clearAllTransactions = useBudgetStore((state) => state.clearAllTransactions);
  const setTransactionsCategory = useBudgetStore((state) => state.setTransactionsCategory);
  const deleteTransactions = useBudgetStore((state) => state.deleteTransactions);
  const addTransaction = useBudgetStore((state) => state.addTransaction);
  const offerUndo = useUndoStore((s) => s.offerUndo);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  const deleteWithUndo = (rows: Transaction[]) => {
    const label =
      rows.length === 1 ? `Deleted "${rows[0].description}"` : `Deleted ${rows.length} transactions`;
    deleteTransactions(rows.map((r) => r.id));
    offerUndo(label, () => {
      for (const tx of rows) addTransaction(tx);
    });
  };

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
      const sliceNames = (tx.splits ?? [])
        .map((s) => (s.categoryId ? categories[s.categoryId]?.name ?? '' : ''))
        .join(' ');
      const haystack = [
        tx.description,
        categoryName,
        sliceNames,
        (tx.tags ?? []).join(' '),
        tx.note ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Selection is scoped to what is currently visible: narrowing the search must
  // not leave invisible rows armed for deletion.
  const visibleIds = txList.map((tx) => tx.id);
  const visibleIdSet = new Set(visibleIds);
  const selected = selectedIds.filter((id) => visibleIdSet.has(id));
  const selectedSet = new Set(selected);
  const allVisibleSelected = visibleIds.length > 0 && selected.length === visibleIds.length;

  // Measured from the first rendered row rather than assumed: a row carrying
  // several tag chips wraps and exceeds the nominal height, which would
  // desynchronise the spacer rows from the real scroll offset. The constant is
  // only the pre-measurement fallback.
  const NOMINAL_ROW_HEIGHT = 48;
  const [rowHeight, setRowHeight] = useState(NOMINAL_ROW_HEIGHT);
  const firstRowRef = useRef<HTMLTableRowElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Intentionally no dependency array: this re-measures after every render so
  // it catches height changes from wrapped tag chips, and the `> 1` guard
  // below stops it looping once the measured value stabilizes.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately unconditional; see comment above
  useEffect(() => {
    const h = firstRowRef.current?.getBoundingClientRect().height;
    if (h && Math.abs(h - rowHeight) > 1) setRowHeight(h);
  });

  const windowed = computeWindow({
    scrollTop,
    viewportHeight,
    rowHeight,
    totalRows: txList.length,
    overscan: 8,
  });
  const visibleRows = txList.slice(windowed.startIndex, windowed.endIndex);

  // Measure the scroll container once it mounts (and whenever the layout
  // toggles between expanded/collapsed) so the first paint already windows
  // the rows instead of waiting for a scroll event to measure clientHeight.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.clientHeight !== viewportHeight) setViewportHeight(el.clientHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, txList.length > 0]);

  // Cards are taller than table rows and carry a 12px gap. This is an
  // estimate, which is why the overscan below is generous: computeWindow
  // degrades to rendering everything when the container is unmeasured, so a
  // wrong estimate costs scroll smoothness, never correctness.
  const CARD_HEIGHT = 116;
  const cardScrollRef = useRef<HTMLDivElement>(null);
  const [cardScrollTop, setCardScrollTop] = useState(0);
  const [cardViewportHeight, setCardViewportHeight] = useState(0);

  useEffect(() => {
    const el = cardScrollRef.current;
    if (el && el.clientHeight !== cardViewportHeight) setCardViewportHeight(el.clientHeight);
  }, [cardViewportHeight]);

  const cardWindow = computeWindow({
    scrollTop: cardScrollTop,
    viewportHeight: cardViewportHeight,
    rowHeight: CARD_HEIGHT,
    totalRows: txList.length,
    overscan: 6,
  });
  const visibleCards = txList.slice(cardWindow.startIndex, cardWindow.endIndex);

  const toggleRow = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const toggleAll = () => setSelectedIds(allVisibleSelected ? [] : visibleIds);

  const getTransactionDisplay = (tx: Transaction) => ({
    amountClass: tx.type === 'income' ? 'text-accent' : 'text-text-primary',
    amountPrefix: tx.type === 'income' ? '+' : '-',
    categoryLabel: tx.splits?.length
      ? `Split · ${tx.splits.length}`
      : tx.categoryId ? categories[tx.categoryId]?.name || 'Unknown' : 'Uncategorized',
    badge: tx.shared
      ? `shared · ${tx.shared.sharedWith}`
      : tx.reimbursement
        ? `reimb · ${tx.reimbursement.from}`
        : null,
    tags: tx.tags ?? [],
    hasNote: !!tx.note,
  });

  const wrapperClass = isExpanded
    ? "fixed inset-4 z-50 bg-bg-secondary border border-border rounded-xl p-6 flex flex-col shadow-2xl animate-fade-in"
    : "mt-8 bg-bg-secondary border border-border rounded-xl p-6 flex flex-col min-h-[240px] desktop:min-h-[300px]";

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
              className="h-[34px] w-40 sm:w-48 pl-7 pr-2 text-[13px] bg-bg-primary border border-border rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent shadow-sm"
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
        <div
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setScrollTop(el.scrollTop);
            if (el.clientHeight !== viewportHeight) setViewportHeight(el.clientHeight);
          }}
          className={`overflow-x-auto ${isExpanded ? 'flex-1 overflow-y-auto' : 'max-h-[560px] overflow-y-auto'}`}
        >
          <div className="hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[12px] text-text-secondary">
                  <th className="pb-2 font-medium w-8">
                    <Checkbox
                      ariaLabel="Select all transactions"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
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
                {windowed.padTop > 0 && (
                  <tr aria-hidden="true"><td colSpan={6} style={{ height: windowed.padTop, padding: 0 }} /></tr>
                )}
                {visibleRows.map((tx, i) => {
                  const { amountClass, amountPrefix, categoryLabel, badge, tags, hasNote } = getTransactionDisplay(tx);
                  return (
                  <tr
                    key={tx.id}
                    ref={i === 0 ? firstRowRef : undefined}
                    className="border-b border-border/50 hover:bg-bg-primary/50 transition-colors group cursor-pointer"
                    onClick={() => setEditingTransaction(tx)}
                  >
                    <td className="py-3 w-8" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        ariaLabel="Select transaction"
                        checked={selectedSet.has(tx.id)}
                        onChange={() => toggleRow(tx.id)}
                      />
                    </td>
                    <td className="py-3 text-[14px] whitespace-nowrap">{tx.date}</td>
                    <td className="py-3 text-[14px]">
                      <button
                        type="button"
                        aria-label={`Edit ${tx.description}`}
                        className="text-left bg-transparent border-0 p-0 m-0 font-inherit text-inherit cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTransaction(tx);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter' && e.key !== ' ') return
                          // Space would otherwise scroll the list out from under the row.
                          e.preventDefault()
                          setEditingTransaction(tx)
                        }}
                      >
                        {tx.description}
                      </button>
                    </td>
                    <td className="py-3 text-[14px]">
                      <span className="px-2 py-1 bg-bg-primary border border-border rounded-md text-[12px]">
                        {categoryLabel}
                      </span>
                      {badge && (
                        <span className="ml-1 px-2 py-1 bg-accent/10 text-accent rounded-md text-[12px]">{badge}</span>
                      )}
                      {tags.map((tag) => (
                        <span key={tag} className="ml-1 px-2 py-1 bg-bg-primary border border-border rounded-md text-[12px] text-text-secondary">
                          #{tag}
                        </span>
                      ))}
                      {hasNote && (
                        <span className="ml-1 text-[12px] text-text-secondary" title="Has a note" aria-label="Has a note">
                          ✎
                        </span>
                      )}
                    </td>
                    <td className={`py-3 text-[14px] font-medium text-right ${amountClass}`}>
                      {amountPrefix}{formatMoney(tx.amount)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWithUndo([tx]);
                        }}
                        aria-label="Delete transaction"
                        className="p-2 text-text-secondary hover:text-error reveal-on-hover transition-opacity rounded-md hover:bg-bg-primary"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                  );
                })}
                {windowed.padBottom > 0 && (
                  <tr aria-hidden="true"><td colSpan={6} style={{ height: windowed.padBottom, padding: 0 }} /></tr>
                )}
              </tbody>
            </table>
          </div>
          <div
            data-testid="transactions-cards"
            ref={cardScrollRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              setCardScrollTop(el.scrollTop);
              if (el.clientHeight !== cardViewportHeight) setCardViewportHeight(el.clientHeight);
            }}
            className="md:hidden flex flex-col gap-3 max-h-[70dvh] overflow-y-auto"
          >
            {cardWindow.padTop > 0 && (
              <div aria-hidden="true" style={{ height: cardWindow.padTop }} />
            )}
            {visibleCards.map(tx => {
              const { amountClass, amountPrefix, categoryLabel, badge, tags, hasNote } = getTransactionDisplay(tx);
              return (
              <div
                key={tx.id}
                data-testid={`transaction-card-${tx.id}`}
                className="themed-card rounded-lg p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span onClick={(e) => e.stopPropagation()} className="mt-1 shrink-0">
                    <Checkbox
                      ariaLabel="Select transaction"
                      checked={selectedSet.has(tx.id)}
                      onChange={() => toggleRow(tx.id)}
                    />
                  </span>
                  <button
                    type="button"
                    aria-label={`Edit ${tx.description}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTransaction(tx);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' && e.key !== ' ') return
                      // Space would otherwise scroll the card list out from under
                      // the focused card.
                      e.preventDefault()
                      setEditingTransaction(tx)
                    }}
                    className="flex items-center justify-between flex-1 min-w-0 text-left bg-transparent border-0 p-0 m-0 font-inherit text-inherit cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    <span className="text-[14px] font-medium text-text-primary truncate">{tx.description}</span>
                    <span className={`text-[14px] font-medium tabular-nums whitespace-nowrap ml-2 ${amountClass}`}>
                      {amountPrefix}{formatMoney(tx.amount)}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWithUndo([tx]);
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
                    {tags.map((tag) => (
                      <span key={tag} className="ml-1 px-2 py-1 bg-bg-primary border border-border rounded-md text-[12px] text-text-secondary">
                        #{tag}
                      </span>
                    ))}
                    {hasNote && (
                      <span className="ml-1 text-[12px] text-text-secondary" title="Has a note" aria-label="Has a note">
                        ✎
                      </span>
                    )}
                  </span>
                </div>
              </div>
              );
            })}
            {cardWindow.padBottom > 0 && (
              <div aria-hidden="true" style={{ height: cardWindow.padBottom }} />
            )}
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
        message={`Every transaction (${Object.keys(transactions).length}) will be deleted, including any hidden by the current search or filter. You can undo this straight afterwards.`}
        confirmLabel="Clear All"
        tone="danger"
        onConfirm={() => {
          const all = Object.values(transactions);
          clearAllTransactions();
          offerUndo(`Cleared ${all.length} transaction${all.length === 1 ? '' : 's'}`, () => {
            for (const tx of all) addTransaction(tx);
          });
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
          deleteWithUndo(txList.filter((tx) => selectedSet.has(tx.id)));
          setSelectedIds([]);
          setConfirmBulkDeleteOpen(false);
        }}
        onCancel={() => setConfirmBulkDeleteOpen(false)}
      />
    </div>
  );
};
