import React from 'react';
import { WidgetWrapper } from '../dashboard/WidgetWrapper';
import { useBudgetStore } from '../../store/useBudgetStore';

export const MonthlySummaryWidget: React.FC = () => {
  const transactions = useBudgetStore((state) => state.transactions);
  
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  
  const thisMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
  
  const totalIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netChange = totalIncome - totalExpense;
  const isPositive = netChange >= 0;

  return (
    <WidgetWrapper title="Monthly Summary">
      <div className="flex flex-col h-full pt-2">
        <div className="flex flex-col gap-2 mb-3 border-b border-border pb-3">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span className="text-text-secondary">Money In</span>
            </div>
            <span className="font-medium text-text-primary">
              +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-text-secondary">Money Out</span>
            </div>
            <span className="font-medium text-text-primary">
              -${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-end mt-auto">
          <span className="text-sm font-medium text-text-secondary">Net Change</span>
          <span className={`text-[20px] font-bold ${isPositive ? 'text-accent' : 'text-red-500'}`}>
            {isPositive ? '+' : '-'}${Math.abs(netChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </WidgetWrapper>
  );
};
