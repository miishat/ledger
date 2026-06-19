import React from 'react';
import { Check, X } from 'lucide-react';
import { WidgetWrapper } from '../dashboard/WidgetWrapper';
import { useTriageStore } from '../../store/useTriageStore';
import { useBudgetStore } from '../../store/useBudgetStore';

export const TriageInboxWidget: React.FC = () => {
  const pendingTransactions = useTriageStore((state) => state.pendingTransactions);
  const updatePending = useTriageStore((state) => state.updatePending);
  const approveTransaction = useTriageStore((state) => state.approveTransaction);
  const rejectTransaction = useTriageStore((state) => state.rejectTransaction);
  
  const categories = useBudgetStore((state) => state.categories);
  
  const txList = Object.values(pendingTransactions).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const categoryList = Object.values(categories);

  if (txList.length === 0) return null;

  return (
    <WidgetWrapper title={`Triage Inbox (${txList.length})`}>
      <div className="flex flex-col gap-3 mt-4 max-h-[400px] overflow-y-auto pr-2">
        {txList.map(tx => (
          <div key={tx.id} className="flex flex-col p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] gap-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{tx.description}</p>
                <p className="text-[12px] text-[var(--color-text-secondary)]">{tx.date}</p>
              </div>
              <span className={`text-[14px] font-bold ${tx.type === 'income' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <select
                value={tx.categoryId || ''}
                onChange={(e) => updatePending(tx.id, { categoryId: e.target.value })}
                className="flex-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1 text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              >
                <option value="">Uncategorized</option>
                {categoryList.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              
              <button
                onClick={() => approveTransaction(tx.id)}
                className="p-1 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
                title="Approve"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => rejectTransaction(tx.id)}
                className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                title="Reject/Delete"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
};
