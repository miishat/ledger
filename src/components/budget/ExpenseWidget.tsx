import React from 'react';
import { WidgetWrapper } from '../dashboard/WidgetWrapper';
import { useBudgetStore } from '../../store/useBudgetStore';

export const ExpenseWidget: React.FC = () => {
  const transactions = useBudgetStore((state) => state.transactions);
  
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  
  const expensesThisMonth = transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth));
  
  const totalExpense = expensesThisMonth.reduce((sum, t) => sum + t.amount, 0);
  
  // Group by category
  const expensesByCategory = expensesThisMonth.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const sortedCategories = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);

  return (
    <WidgetWrapper title="Expenses">
      <div className="flex flex-col gap-4 mt-4 h-full">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-bold text-red-500">${totalExpense.toFixed(2)}</span>
          <span className="text-[12px] text-text-secondary">This month</span>
        </div>
        
        {sortedCategories.length > 0 ? (
          <div className="flex flex-col gap-2 mt-2 overflow-y-auto max-h-[200px] pr-2">
            {sortedCategories.map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center p-2 bg-bg-secondary rounded border border-border">
                <span className="text-[14px] text-text-primary">{category}</span>
                <span className="text-[14px] font-medium">${amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[14px] text-text-secondary mt-2">
            No expenses this month.
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
};
