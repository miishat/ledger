import React from 'react';
import { WidgetWrapper } from '../dashboard/WidgetWrapper';
import { useBudgetStore } from '../../store/useBudgetStore';
import { formatMoney } from '../planner/format';
import { EmptyState } from '../ui/EmptyState';

interface ExpenseWidgetProps {
  selectedMonth: string; // YYYY-MM
}

export const ExpenseWidget: React.FC<ExpenseWidgetProps> = ({ selectedMonth }) => {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  
  const transactionsList = Object.values(transactions);
  
  const expensesThisMonth = transactionsList.filter(t => t.type === 'expense' && t.date.startsWith(selectedMonth));
  
  const totalExpense = expensesThisMonth.reduce((sum, t) => sum + t.amount, 0);
  
  // Group by category
  const expensesByCategory = expensesThisMonth.reduce((acc, t) => {
    let catName = 'Uncategorized';
    if (t.categoryId) {
      catName = categories[t.categoryId]?.name || t.categoryId;
    }
    acc[catName] = (acc[catName] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const sortedCategories = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);

  return (
    <WidgetWrapper title="Expenses">
      <div className="flex flex-col gap-4 mt-4 h-full">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-bold text-error">{formatMoney(totalExpense)}</span>
          <span className="text-[12px] text-text-secondary">This month</span>
        </div>
        
        {sortedCategories.length > 0 ? (
          <div className="flex flex-col gap-2 mt-2 overflow-y-auto max-h-[200px] pr-2">
            {sortedCategories.map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center p-2 bg-bg-secondary rounded border border-border">
                <span className="text-[14px] text-text-primary">{category}</span>
                <span className="text-[14px] font-medium">{formatMoney(amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No expenses this month" hint="Log a transaction to see your spending broken down by category." />
        )}
      </div>
    </WidgetWrapper>
  );
};
