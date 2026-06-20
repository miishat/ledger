import React, { useState } from 'react';
import { useBudgetStore } from '../../store/useBudgetStore';
import { TransactionModal } from './TransactionModal';
import type { Transaction } from '../../types/budget';
import { Trash2, Filter } from 'lucide-react';

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

  const txList = Object.values(transactions)
    .filter(tx => tx.date.startsWith(selectedMonth))
    .filter(tx => selectedCategoryId === '' || tx.categoryId === selectedCategoryId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mt-8 bg-bg-secondary border border-border rounded-xl p-6 flex flex-col min-h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-semibold text-text-primary">All Transactions</h2>
          <div className="flex items-center gap-1 text-text-secondary">
            <Filter size={14} />
            <select 
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="bg-bg-primary border border-border rounded px-2 py-1 text-[13px] focus:outline-none focus:border-accent"
            >
              <option value="">All Categories</option>
              {Object.values(categories).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        {txList.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all transactions? This cannot be undone.')) {
                clearAllTransactions();
              }
            }}
            className="text-[14px] text-red-500 hover:text-red-400 transition-colors border border-red-500/30 hover:bg-red-500/10 px-3 py-1 rounded-md"
          >
            Clear All
          </button>
        )}
      </div>
      {txList.length === 0 ? (
        <p className="text-text-secondary text-[14px] flex-grow flex items-center justify-center">
          No transactions yet. Import a CSV or add one manually to see it here.
        </p>
      ) : (
        <div className="overflow-x-auto">
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
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </td>
                  <td className="py-3 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTransaction(tx.id);
                      }}
                      className="p-1.5 text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-bg-primary"
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
