import React, { useState } from 'react';
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
import { useDashboardLayoutStore } from '../store/useDashboardLayoutStore';

export const Dashboard: React.FC = () => {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [dragId, setDragId] = useState<string | null>(null);
  const moveWidget = useDashboardLayoutStore((s) => s.moveWidget);
  const storedOrder = useDashboardLayoutStore((s) => s.order);
  const setOrder = useDashboardLayoutStore((s) => s.setOrder);

  const DASHBOARD_WIDGETS: { id: string; element: React.ReactNode }[] = [
    { id: 'net-worth', element: <NetWorthTrendWidget /> },
    { id: 'trend', element: <NetWorthWidget /> },
    { id: 'monthly-summary', element: <MonthlySummaryWidget selectedMonth={currentMonth} /> },
    { id: 'bank', element: <AccountCategoryWidget title="Bank Accounts" type="bank" /> },
    { id: 'investment-accounts', element: <AccountCategoryWidget title="Investment Accounts" type="investment" /> },
    { id: 'income', element: <IncomeWidget selectedMonth={currentMonth} /> },
    { id: 'expense', element: <ExpenseWidget selectedMonth={currentMonth} /> },
    { id: 'receivable', element: <AccountCategoryWidget title="Receivables" type="receivable" /> },
    { id: 'other', element: <AccountCategoryWidget title="Others" type="other" /> },
    { id: 'debt', element: <AccountCategoryWidget title="Debts & Liabilities" type="debt" /> },
    { id: 'portfolio', element: <PortfolioRollupWidget /> },
    { id: 'comp', element: <CompSnapshotWidget /> },
    { id: 'budget-health', element: <BudgetHealthWidget /> },
    { id: 'top-goal', element: <PlannerGoalWidget /> },
  ];

  const defaultIds = DASHBOARD_WIDGETS.map((w) => w.id);
  const orderedIds = [
    ...storedOrder.filter((id) => defaultIds.includes(id)),
    ...defaultIds.filter((id) => !storedOrder.includes(id)),
  ];

  return (
    <div className="p-6 h-full w-full">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Dashboard</h1>
          <p className="text-text-secondary">Overview of your financial universe</p>
        </div>
      </div>

      <BentoGrid>
        {orderedIds.map((id) => {
          const w = DASHBOARD_WIDGETS.find((x) => x.id === id)!;
          return (
            <div
              key={id}
              draggable
              onDragStart={() => setDragId(id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId && dragId !== id) {
                  if (storedOrder.length === 0) setOrder(orderedIds); // materialize default before first move
                  moveWidget(dragId, id);
                }
                setDragId(null);
              }}
              className={`cursor-grab active:cursor-grabbing ${dragId === id ? 'opacity-50' : ''}`}
            >
              {w.element}
            </div>
          );
        })}
      </BentoGrid>
    </div>
  );
};
