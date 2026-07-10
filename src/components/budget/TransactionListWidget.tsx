import React, { useState } from 'react';
import { useBudgetStore } from '../../store/useBudgetStore';
import { TransactionModal } from './TransactionModal';
import type { Transaction } from '../../types/budget';
import { Trash2, Maximize2, Minimize2, Receipt } from 'lucide-react';
import { ThemedSelect } from '../ui/ThemedSelect';
import { formatMoney } from '../planner/format';
import { EmptyState } from '../ui/EmptyState';

interface TransactionListWidgetProps {
  selectedMonth: string;
}

export const TransactionListWidget: React.FC<TransactionListWidgetProps> = ({ selectedMonth }) => {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const deleteTransaction = useBudgetStore((state) => state.deleteTransaction);
  const clearAllTransactions = useBudgetStore((state) => state.clearAllTransactions);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  const txList = Object.values(transactions)
    .filter(tx => tx.date.startsWith(selectedMonth))
    .filter(tx => {
      if (selectedCategoryId === '') return true;
      if (selectedCategoryId === 'uncategorized') return !tx.categoryId;
      return tx.categoryId === selectedCategoryId;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const wrapperClass = isExpanded 
    ? "fixed inset-4 z-50 bg-bg-secondary border border-border rounded-xl p-6 flex flex-col shadow-2xl animate-fade-in"
    : "mt-8 bg-bg-secondary border border-border rounded-xl p-6 flex flex-col min-h-[300px]";

  return (
    <div className={wrapperClass}>
      <div className="flex flex-wrap justify-between items-center gap-y-2 mb-4 border-b border-border pb-4">
        <h2 className="text-[18px] font-semibold text-text-primary">All Transactions</h2>
        <div className="flex flex-wrap items-center gap-3 min-w-0">
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
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all transactions? This cannot be undone.')) {
                  clearAllTransactions();
                }
              }}
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
      {txList.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <EmptyState icon={Receipt} message="No transactions yet" hint="Import a CSV or add one manually to see it here." />
        </div>
      ) : (
        <div className={`overflow-x-auto ${isExpanded ? 'flex-1 overflow-y-auto' : ''}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[12px] text-text-secondary">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium text-right">Amount</th>
                <th className="pb-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {txList.map(tx => (
                <tr 
                  key={tx.id} 
                  className="border-b border-border/50 hover:bg-bg-primary/50 transition-colors group cursor-pointer"
                  onClick={() => setEditingTransaction(tx)}
                >
                  <td className="py-3 text-[14px] whitespace-nowrap">{tx.date}</td>
                  <td className="py-3 text-[14px]">{tx.description}</td>
                  <td className="py-3 text-[14px]">
                    <span className="px-2 py-1 bg-bg-primary border border-border rounded-md text-[12px]">
                      {tx.categoryId ? categories[tx.categoryId]?.name || 'Unknown' : 'Uncategorized'}
                    </span>
                  </td>
                  <td className={`py-3 text-[14px] font-medium text-right ${tx.type === 'income' ? 'text-accent' : 'text-text-primary'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TransactionModal 
        isOpen={!!editingTransaction} 
        onClose={() => setEditingTransaction(null)} 
        initialTransaction={editingTransaction} 
      />
    </div>
  );
};
