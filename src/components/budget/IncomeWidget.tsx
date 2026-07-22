import React from 'react';
import { WidgetWrapper } from '../dashboard/WidgetWrapper';
import { useBudgetStore } from '../../store/useBudgetStore';
import { formatMoney } from '../planner/format';
import { countsAsIncome } from '../../utils/budget/sharedExpenses';
import { inRange, isSingleMonth, type MonthRange } from '../../utils/budget/period';

interface IncomeWidgetProps {
  range: MonthRange;
}

export const IncomeWidget: React.FC<IncomeWidgetProps> = ({ range }) => {
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);

  const incomeThisMonth = Object.values(transactions).filter(t => countsAsIncome(t) && inRange(t.date, range));

  const totalIncome = incomeThisMonth.reduce((sum, t) => sum + t.amount, 0);

  // Break down by income category (Salary, RSU, ...) so you can see the source.
  const incomeBySource = incomeThisMonth.reduce((acc, t) => {
    const name = (t.categoryId && categories[t.categoryId]?.name) || 'Other income';
    acc[name] = (acc[name] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedSources = Object.entries(incomeBySource).sort((a, b) => b[1] - a[1]);

  return (
    <WidgetWrapper title="Income">
      <div className="flex flex-col gap-4 mt-4 h-full">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-bold text-accent">{formatMoney(totalIncome)}</span>
          <span className="text-[12px] text-text-secondary">{isSingleMonth(range) ? 'This Month' : `${range.from} to ${range.to}`}</span>
        </div>

        {sortedSources.length > 0 && (
          <div className="flex flex-col gap-2 mt-2 overflow-y-auto max-h-[200px] pr-2">
            {sortedSources.map(([source, amount]) => (
              <div key={source} className="flex justify-between items-center p-2 bg-bg-secondary rounded border border-border">
                <span className="text-[14px] text-text-primary">{source}</span>
                <span className="text-[14px] font-medium">{formatMoney(amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
};
