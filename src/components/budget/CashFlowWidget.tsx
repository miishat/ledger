import React from 'react';
import { WidgetWrapper } from '../WidgetWrapper';
import { useBudgetStore } from '../../../store/useBudgetStore';

export const CashFlowWidget: React.FC = () => {
  const transactions = useBudgetStore((state) => state.transactions);
  
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  
  const thisMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
  
  const totalIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const cashFlow = totalIncome - totalExpense;
  const isPositive = cashFlow >= 0;

  return (
    <WidgetWrapper title="Cash Flow">
      <div className="flex flex-col gap-2 mt-4">
        <span className={`text-[28px] font-bold ${isPositive ? 'text-accent' : 'text-red-500'}`}>
          {isPositive ? '+' : '-'}${Math.abs(cashFlow).toFixed(2)}
        </span>
        <span className="text-[12px] text-text-secondary">This month's net</span>
      </div>
    </WidgetWrapper>
  );
};
