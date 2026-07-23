import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthKeyOf, rangeOf, shiftMonthKey, type Period, type PeriodPreset } from '../utils/budget/period';
import { ThemedSelect } from '../components/ui/ThemedSelect';
import { IncomeWidget } from '../components/budget/IncomeWidget';
import { ExpenseWidget } from '../components/budget/ExpenseWidget';
import { MonthlySummaryWidget } from '../components/budget/MonthlySummaryWidget';
import { TransactionModal } from '../components/budget/TransactionModal';
import { CSVUploader } from '../components/budget/CSVUploader';
import { TriageInboxWidget } from '../components/budget/TriageInboxWidget';
import { CategorizationRulesWidget } from '../components/budget/CategorizationRulesWidget';
import { TransactionListWidget } from '../components/budget/TransactionListWidget';
import { CategoryManagerWidget } from '../components/budget/CategoryManagerWidget';
import { SubscriptionsWidget } from '../components/budget/SubscriptionsWidget';
import { AnomalyAlertsWidget } from '../components/budget/AnomalyAlertsWidget';
import { CashFlowWidget } from '../components/budget/CashFlowWidget';
import { SpendingHeatmapWidget } from '../components/budget/SpendingHeatmapWidget';
import { CategoryTrendsWidget } from '../components/budget/CategoryTrendsWidget';
import { BudgetProgressWidget } from '../components/budget/BudgetProgressWidget';
import { ParadigmBanner } from '../components/budget/ParadigmBanner';
import { ReallocationHistory } from '../components/budget/ReallocationHistory';
import { OwedToMeWidget } from '../components/budget/OwedToMeWidget';
import { SavingsRateWidget } from '../components/budget/SavingsRateWidget';
import { useBudgetStore } from '../store/useBudgetStore';

export const Budgeting: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const categories = useBudgetStore((state) => state.categories);
  const seedDefaults = useBudgetStore((state) => state.seedDefaults);

  const [tab, setTab] = useState<'overview' | 'insights' | 'transactions' | 'setup'>('overview');

  const currentMonth = monthKeyOf(new Date());
  const [period, setPeriod] = useState<Period>({ kind: 'month', month: currentMonth });
  const range = rangeOf(period);

  const shiftMonth = (delta: number) => {
    if (period.kind !== 'month') return;
    setPeriod({ kind: 'month', month: shiftMonthKey(period.month, delta) });
  };

  const formattedMonth = period.kind === 'month'
    ? new Date(`${period.month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : `${range.from} to ${range.to}`;

  React.useEffect(() => {
    if (Object.keys(categories).length === 0) {
      seedDefaults();
    }
  }, [categories, seedDefaults]);

  return (
    <div className="flex flex-col gap-6 w-full min-h-full animate-fade-in">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-text-primary">Budgeting</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Manage your income, track expenses, and view your cash flow.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <ThemedSelect
            value={period.kind === 'month' ? (period.month === currentMonth ? 'thisMonth' : 'pickedMonth') : period.preset}
            onChange={(v) => {
              if (v === 'thisMonth') setPeriod({ kind: 'month', month: currentMonth });
              else if (v === 'lastMonth') setPeriod({ kind: 'month', month: shiftMonthKey(currentMonth, -1) });
              else if (v !== 'pickedMonth') setPeriod({ kind: 'preset', preset: v as PeriodPreset });
            }}
            className="text-[13px]"
            options={[
              ...(period.kind === 'month' && period.month !== currentMonth
                ? [{ value: 'pickedMonth', label: formattedMonth }]
                : []),
              { value: 'thisMonth', label: 'This month' },
              { value: 'lastMonth', label: 'Last month' },
              { value: 'last3', label: 'Last 3 months' },
              { value: 'last6', label: 'Last 6 months' },
              { value: 'last12', label: 'Last 12 months' },
              { value: 'ytd', label: 'Year to date' },
            ]}
          />
          {period.kind === 'month' && (
            <div className="flex items-center gap-1 bg-bg-secondary rounded-lg p-1 border border-border shadow-sm">
              <button
                onClick={() => shiftMonth(-1)}
                className="p-1.5 rounded-md hover:bg-bg-primary text-text-secondary hover:text-accent transition-all duration-200"
                aria-label="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[14px] font-medium min-w-[120px] text-center">{formattedMonth}</span>
              <button
                onClick={() => shiftMonth(1)}
                className="p-1.5 rounded-md hover:bg-bg-primary text-text-secondary hover:text-accent transition-all duration-200"
                aria-label="Next Month"
              >
                <ChevronRight size={16} />
              </button>
              {period.month !== currentMonth && (
                <button
                  onClick={() => setPeriod({ kind: 'month', month: currentMonth })}
                  className="px-2 py-1 rounded-md text-[12px] font-medium text-accent hover:bg-bg-primary transition-all duration-200"
                >
                  Today
                </button>
              )}
            </div>
          )}
          <CSVUploader />
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            Add Transaction
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {(['overview', 'insights', 'transactions', 'setup'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${
              tab === t ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {t === 'overview' ? 'Overview' : t === 'insights' ? 'Insights' : t === 'transactions' ? 'Transactions' : 'Setup'}
          </button>
        ))}
      </div>

      <ParadigmBanner selectedMonth={range.to} />

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <IncomeWidget range={range} />
            <ExpenseWidget range={range} />
            <MonthlySummaryWidget range={range} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BudgetProgressWidget range={range} />
            <CashFlowWidget range={range} />
          </div>

          <SavingsRateWidget range={range} />

          <OwedToMeWidget />
        </>
      )}

      {tab === 'insights' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SubscriptionsWidget />
            <AnomalyAlertsWidget range={range} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SpendingHeatmapWidget range={range} />
            <CategoryTrendsWidget range={range} />
          </div>
        </>
      )}

      {tab === 'transactions' && (
        <>
          <TriageInboxWidget />

          <TransactionListWidget range={range} />
        </>
      )}

      {tab === 'setup' && (
        <>
          <CategoryManagerWidget selectedMonth={range.to} />

          <ReallocationHistory selectedMonth={range.to} />

          <CategorizationRulesWidget />
        </>
      )}

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
