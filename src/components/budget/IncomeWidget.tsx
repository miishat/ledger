import React from 'react';
import { WidgetWrapper } from '../dashboard/WidgetWrapper';
import { useBudgetStore } from '../../store/useBudgetStore';

interface IncomeWidgetProps {
  selectedMonth: string; // YYYY-MM
}

export const IncomeWidget: React.FC<IncomeWidgetProps> = ({ selectedMonth }) => {
  const transactions = useBudgetStore((state) => state.transactions);
  
  const transactionsList = Object.values(transactions);
  
  const transactionsList = Object.values(transactions);
  
  const totalIncome = transactionsList
    .filter(t => t.type === 'income' && t.date.startsWith(selectedMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <WidgetWrapper title="Income">
      <div className="flex flex-col gap-2 mt-4">
        <span className="text-[28px] font-bold text-accent">${totalIncome.toFixed(2)}</span>
        <span className="text-[12px] text-text-secondary">This month</span>
      </div>
    </WidgetWrapper>
  );
};
