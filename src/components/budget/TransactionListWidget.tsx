import React, { useState } from 'react';
import { useBudgetStore } from '../../store/useBudgetStore';
import { TransactionModal } from './TransactionModal';
import type { Transaction } from '../../types/budget';

export const TransactionListWidget: React.FC = () => {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const txList = Object.values(transactions).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mt-8 bg-bg-secondary border border-border rounded-xl p-6 flex flex-col min-h-[300px]">
      <h2 className="text-[18px] font-semibold text-text-primary mb-4">All Transactions</h2>
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
              </tr>
            </thead>
            <tbody>
              {txList.map(tx => (
                <tr 
                  key={tx.id} 
                  className="border-b border-border/50 hover:bg-bg-primary/50 transition-colors cursor-pointer"
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
