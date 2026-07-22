import React from 'react';
import { WidgetWrapper } from '../dashboard/WidgetWrapper';
import { useBudgetStore } from '../../store/useBudgetStore';
import { formatMoney } from '../planner/format';
import { inRange, isSingleMonth, type MonthRange } from '../../utils/budget/period';

interface ExpenseWidgetProps {
  range: MonthRange;
}

export const ExpenseWidget: React.FC<ExpenseWidgetProps> = ({ range }) => {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const categoryGroups = useBudgetStore((state) => state.categoryGroups);

  const transactionsList = Object.values(transactions);

  const expensesThisMonth = transactionsList.filter(t => t.type === 'expense' && inRange(t.date, range));

  const totalExpense = expensesThisMonth.reduce((sum, t) => sum + t.amount, 0);

  // Group by category group (Housing, Food, ...), not individual category.
  const expensesByGroup = expensesThisMonth.reduce((acc, t) => {
    const groupId = t.categoryId ? categories[t.categoryId]?.groupId : undefined;
    const groupName = (groupId && categoryGroups[groupId]?.name) || 'Uncategorized';
    acc[groupName] = (acc[groupName] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedGroups = Object.entries(expensesByGroup).sort((a, b) => b[1] - a[1]);

  return (
    <WidgetWrapper title="Expenses">
      <div className="flex flex-col gap-4 mt-4 h-full">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-bold text-error">{formatMoney(totalExpense)}</span>
          <span className="text-[12px] text-text-secondary">{isSingleMonth(range) ? 'This Month' : `${range.from} to ${range.to}`}</span>
        </div>
        
        {sortedGroups.length > 0 && (
          <div className="flex flex-col gap-2 mt-2 overflow-y-auto max-h-[200px] pr-2">
            {sortedGroups.map(([group, amount]) => (
              <div key={group} className="flex justify-between items-center p-2 bg-bg-secondary rounded border border-border">
                <span className="text-[14px] text-text-primary">{group}</span>
                <span className="text-[14px] font-medium">{formatMoney(amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
};
