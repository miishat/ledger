import React from 'react';
import { BentoGrid } from '../components/dashboard/BentoGrid';
import { NetWorthWidget } from '../components/dashboard/widgets/NetWorthWidget';
import { IncomeWidget } from '../components/budget/IncomeWidget';
import { ExpenseWidget } from '../components/budget/ExpenseWidget';
import { MonthlySummaryWidget } from '../components/budget/MonthlySummaryWidget';
import { AccountCategoryWidget } from '../components/dashboard/AccountCategoryWidget';
import { NetWorthTrendWidget } from '../components/dashboard/widgets/NetWorthTrendWidget';
import { PortfolioRollupWidget } from '../components/dashboard/widgets/PortfolioRollupWidget';
import { CompSnapshotWidget } from '../components/dashboard/widgets/CompSnapshotWidget';
import { BudgetHealthWidget } from '../components/dashboard/widgets/BudgetHealthWidget';
import { PlannerGoalWidget } from '../components/dashboard/widgets/PlannerGoalWidget';

export const Dashboard: React.FC = () => {
  const currentMonth = new Date().toISOString().substring(0, 7);

  return (
    <div className="p-6 h-full w-full">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Dashboard</h1>
          <p className="text-text-secondary">Overview of your financial universe</p>
        </div>
      </div>
      
      <BentoGrid>
        <NetWorthTrendWidget />

        <NetWorthWidget />
        <MonthlySummaryWidget selectedMonth={currentMonth} />

        <AccountCategoryWidget title="Bank Accounts" type="bank" />
        <AccountCategoryWidget title="Investment Accounts" type="investment" />

        <IncomeWidget selectedMonth={currentMonth} />
        <ExpenseWidget selectedMonth={currentMonth} />

        <AccountCategoryWidget title="Receivables" type="receivable" />
        <AccountCategoryWidget title="Others" type="other" />
        <AccountCategoryWidget title="Debts & Liabilities" type="debt" />

        <PortfolioRollupWidget />
        <CompSnapshotWidget />
        <BudgetHealthWidget />
        <PlannerGoalWidget />
      </BentoGrid>
    </div>
  );
};

