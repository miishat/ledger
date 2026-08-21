import React, { Suspense, useState } from 'react';
import { BentoGrid } from '../components/dashboard/BentoGrid';
import { NetWorthWidget } from '../components/dashboard/widgets/NetWorthWidget';
import { IncomeWidget } from '../components/budget/IncomeWidget';
import { ExpenseWidget } from '../components/budget/ExpenseWidget';
import { MonthlySummaryWidget } from '../components/budget/MonthlySummaryWidget';
import { AccountCategoryWidget } from '../components/dashboard/AccountCategoryWidget';
import { PortfolioRollupWidget } from '../components/dashboard/widgets/PortfolioRollupWidget';
import { BudgetHealthWidget } from '../components/dashboard/widgets/BudgetHealthWidget';
import { PlannerGoalWidget } from '../components/dashboard/widgets/PlannerGoalWidget';
import { UpcomingVestsWidget } from '../components/dashboard/widgets/UpcomingVestsWidget';
import { useDashboardLayoutStore } from '../store/useDashboardLayoutStore';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { CustomizeDashboard } from '../components/dashboard/CustomizeDashboard';
import { FirstRunChecklist } from '../components/dashboard/FirstRunChecklist';
import { useAccountsStore } from '../store/useAccountsStore';
import { useBudgetStore } from '../store/useBudgetStore';
import { DASHBOARD_WIDGET_IDS, DASHBOARD_WIDGET_LABELS, WIDGET_SPAN } from './dashboardWidgets';

// Re-exported so callers (and tests) can import ids/labels from this module too.
export { DASHBOARD_WIDGET_IDS, DASHBOARD_WIDGET_LABELS };

// NetWorthTrendWidget pulls in recharts, which is split into its own build
// chunk (see vite.config.ts). The chart chunk itself now loads eagerly for
// every visit regardless of this lazy boundary, since this bundler version
// cannot express reachability-correct splitting for it and it stays in the
// PWA precache rather than being fetched on demand. Lazy-loading the widget
// still defers parsing and executing the chart code until it actually
// mounts, which is a real render-time benefit independent of network timing.
const NetWorthTrendWidget = React.lazy(() =>
  import('../components/dashboard/widgets/NetWorthTrendWidget').then((m) => ({ default: m.NetWorthTrendWidget }))
);

export const Dashboard: React.FC = () => {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [dragId, setDragId] = useState<string | null>(null);
  const moveWidget = useDashboardLayoutStore((s) => s.moveWidget);
  const storedOrder = useDashboardLayoutStore((s) => s.order);
  const setOrder = useDashboardLayoutStore((s) => s.setOrder);
  const hidden = useDashboardLayoutStore((s) => s.hidden);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const accountCount = useAccountsStore((s) => s.accounts.length);
  const transactionCount = useBudgetStore((s) => Object.keys(s.transactions).length);

  // id -> element pairing stays render-scoped: most widgets depend on `currentMonth`
  // (recomputed each render), so the elements themselves cannot be hoisted alongside the ids.
  const DASHBOARD_WIDGETS: { id: string; element: React.ReactNode }[] = [
    {
      id: 'net-worth',
      element: (
        <Suspense fallback={<div className="min-h-[292px]" aria-hidden="true" />}>
          <NetWorthTrendWidget />
        </Suspense>
      ),
    },
    { id: 'trend', element: <NetWorthWidget /> },
    { id: 'monthly-summary', element: <MonthlySummaryWidget range={{ from: currentMonth, to: currentMonth }} /> },
    { id: 'bank', element: <AccountCategoryWidget title="Bank Accounts" type="bank" /> },
    { id: 'investment-accounts', element: <AccountCategoryWidget title="Investment Accounts" type="investment" /> },
    { id: 'income', element: <IncomeWidget range={{ from: currentMonth, to: currentMonth }} /> },
    { id: 'expense', element: <ExpenseWidget range={{ from: currentMonth, to: currentMonth }} /> },
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

  // Hidden widgets stay out of the render but orderedIds (all ids, hidden
  // included) still goes to the Customize panel and to moveBy, so a hidden
  // widget's position survives instead of being dropped from saved layout.
  const visibleWidgets = resolvedWidgets.filter((w) => !hidden.includes(w.id));

  return (
    <div className="min-h-full w-full">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-[24px] font-semibold text-text-primary">Dashboard</h1>
          <p className="text-[14px] text-text-secondary mt-1">All your accounts, balances, and trends in one place.</p>
        </div>
        <button
          type="button"
          onClick={() => setCustomizeOpen(true)}
          className="px-3 py-2 rounded-md text-[13px] font-medium border control-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
        >
          Customize
        </button>
      </div>

      <FirstRunChecklist accountCount={accountCount} transactionCount={transactionCount} />

      <BentoGrid>
        {visibleWidgets.map(({ id, element }) => {
          return (
            <div
              key={id}
              draggable={isDesktop}
              onDragStart={isDesktop ? () => setDragId(id) : undefined}
              onDragOver={isDesktop ? (e) => e.preventDefault() : undefined}
              onDrop={isDesktop ? () => {
                if (dragId && dragId !== id) {
                  if (storedOrder.length === 0) setOrder(orderedIds); // materialize default before first move
                  moveWidget(dragId, id);
                }
                setDragId(null);
              } : undefined}
              onDragEnd={isDesktop ? () => setDragId(null) : undefined}
              className={`h-full ${WIDGET_SPAN[id] ?? ''} ${isDesktop ? 'cursor-grab active:cursor-grabbing' : ''} ${dragId === id ? 'opacity-50' : ''}`}
            >
              {element}
            </div>
          );
        })}
      </BentoGrid>

      <CustomizeDashboard open={customizeOpen} onClose={() => setCustomizeOpen(false)} orderedIds={orderedIds} />
    </div>
  );
};
