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

  const transactionsList = Object.values(transactions);

  const totalIncome = transactionsList
    .filter(t => countsAsIncome(t) && inRange(t.date, range))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <WidgetWrapper title="Income">
      <div className="flex items-baseline gap-2 mt-4">
        <span className="text-[28px] font-bold text-accent">{formatMoney(totalIncome)}</span>
        <span className="text-[12px] text-text-secondary">{isSingleMonth(range) ? 'This Month' : `${range.from} to ${range.to}`}</span>
      </div>
    </WidgetWrapper>
  );
};
