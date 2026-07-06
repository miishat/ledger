import React, { useState } from 'react';
import { BentoGrid } from '../components/dashboard/BentoGrid';
import { NetWorthWidget } from '../components/dashboard/widgets/NetWorthWidget';
import { IncomeWidget } from '../components/budget/IncomeWidget';
import { ExpenseWidget } from '../components/budget/ExpenseWidget';
import { MonthlySummaryWidget } from '../components/budget/MonthlySummaryWidget';
import { AccountCategoryWidget } from '../components/dashboard/AccountCategoryWidget';
import { NetWorthTrendWidget } from '../components/dashboard/widgets/NetWorthTrendWidget';
import { PortfolioRollupWidget } from '../components/dashboard/widgets/PortfolioRollupWidget';
import { BudgetHealthWidget } from '../components/dashboard/widgets/BudgetHealthWidget';
import { PlannerGoalWidget } from '../components/dashboard/widgets/PlannerGoalWidget';
import { UpcomingVestsWidget } from '../components/dashboard/widgets/UpcomingVestsWidget';
import { useDashboardLayoutStore } from '../store/useDashboardLayoutStore';

// Canonical default widget order/ids, hoisted to module scope so it is a stable
// reference across renders (ids are what get persisted/reordered, not the elements).
// NOTE: 'net-worth' = NetWorthTrendWidget (the trend chart) and 'trend' = NetWorthWidget
// (the point-in-time figure). This naming looks swapped but is deliberate/historical —
// these ids are persisted in stored layouts, so do NOT "fix" the pairing here, it would
// orphan existing users' saved widget order.
const DASHBOARD_WIDGET_IDS: string[] = [
  'net-worth',
  'trend',
  'monthly-summary',
  'bank',
  'investment-accounts',
  'income',
  'expense',
  'receivable',
  'other',
  'debt',
  'portfolio',
  'budget-health',
  'top-goal',
  'upcoming-vests',
];

// Grid placement lives on the draggable wrapper div (the actual grid child), not on the
// widget's own root element, since Tailwind col-span only affects direct grid children.
const WIDGET_SPAN: Record<string, string> = {
  'net-worth': 'md:col-span-2',
  trend: 'col-span-1 md:col-span-2 lg:col-span-1',
};

export const Dashboard: React.FC = () => {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [dragId, setDragId] = useState<string | null>(null);
  const moveWidget = useDashboardLayoutStore((s) => s.moveWidget);
  const storedOrder = useDashboardLayoutStore((s) => s.order);
  const setOrder = useDashboardLayoutStore((s) => s.setOrder);

  // id -> element pairing stays render-scoped: most widgets depend on `currentMonth`
  // (recomputed each render), so the elements themselves cannot be hoisted alongside the ids.
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
    { id: 'budget-health', element: <BudgetHealthWidget /> },
    { id: 'top-goal', element: <PlannerGoalWidget /> },
    { id: 'upcoming-vests', element: <UpcomingVestsWidget /> },
  ];

  const defaultIds = DASHBOARD_WIDGET_IDS;
  const orderedIds = [
    ...storedOrder.filter((id) => defaultIds.includes(id)),
    ...defaultIds.filter((id) => !storedOrder.includes(id)),
  ];

  // Null-safe resolution: if an id in orderedIds has no matching widget (e.g. a
  // future id mismatch between DASHBOARD_WIDGET_IDS and DASHBOARD_WIDGETS), it is
  // skipped instead of crashing the render with a non-null assertion.
  const resolvedWidgets = orderedIds
    .map((id) => {
      const widget = DASHBOARD_WIDGETS.find((x) => x.id === id);
      return widget ? { id, element: widget.element } : null;
    })
    .filter((w): w is { id: string; element: React.ReactNode } => w !== null);

  return (
    <div className="p-6 h-full w-full">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-[24px] font-semibold text-text-primary">Master Dashboard</h1>
          <p className="text-[14px] text-text-secondary mt-1">Overview of your financial universe</p>
        </div>
      </div>

      <BentoGrid>
        {resolvedWidgets.map(({ id, element }) => {
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
              onDragEnd={() => setDragId(null)}
              className={`h-full cursor-grab active:cursor-grabbing ${WIDGET_SPAN[id] ?? ''} ${dragId === id ? 'opacity-50' : ''}`}
            >
              {element}
            </div>
          );
        })}
      </BentoGrid>
    </div>
  );
};
