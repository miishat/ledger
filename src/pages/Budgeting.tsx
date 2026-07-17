import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import { SankeyWidget } from '../components/budget/SankeyWidget';
import { SpendingHeatmapWidget } from '../components/budget/SpendingHeatmapWidget';
import { CategoryTrendsWidget } from '../components/budget/CategoryTrendsWidget';
import { BudgetProgressWidget } from '../components/budget/BudgetProgressWidget';
import { ParadigmBanner } from '../components/budget/ParadigmBanner';
import { ReallocationHistory } from '../components/budget/ReallocationHistory';
import { useBudgetStore } from '../store/useBudgetStore';

export const Budgeting: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const categories = useBudgetStore((state) => state.categories);
  const seedDefaults = useBudgetStore((state) => state.seedDefaults);

  const [tab, setTab] = useState<'overview' | 'insights' | 'transactions' | 'setup'>('overview');

  // Local-time month key: toISOString() is UTC, which rolls a local first-of-month
  // back to the previous month in UTC+ timezones.
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(new Date()));
  const currentMonth = monthKey(new Date());

  const shiftMonth = (delta: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    setSelectedMonth(monthKey(new Date(year, month - 1 + delta, 1)));
  };
  
  const formattedMonth = new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  React.useEffect(() => {
    if (Object.keys(categories).length === 0) {
      seedDefaults();
    }
  }, [categories, seedDefaults]);

  return (
    <div className="flex flex-col gap-6 w-full min-h-full p-6 animate-fade-in">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-text-primary">Budgeting</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Manage your income, track expenses, and view your cash flow.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
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
            {selectedMonth !== currentMonth && (
              <button
                onClick={() => setSelectedMonth(currentMonth)}
                className="px-2 py-1 rounded-md text-[12px] font-medium text-accent hover:bg-bg-primary transition-all duration-200"
              >
                Today
              </button>
            )}
          </div>
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

      <ParadigmBanner selectedMonth={selectedMonth} />

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <IncomeWidget selectedMonth={selectedMonth} />
            <ExpenseWidget selectedMonth={selectedMonth} />
            <MonthlySummaryWidget selectedMonth={selectedMonth} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BudgetProgressWidget selectedMonth={selectedMonth} />
            <SankeyWidget selectedMonth={selectedMonth} />
          </div>
        </>
      )}

      {tab === 'insights' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SubscriptionsWidget />
            <AnomalyAlertsWidget selectedMonth={selectedMonth} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SpendingHeatmapWidget selectedMonth={selectedMonth} />
            <CategoryTrendsWidget selectedMonth={selectedMonth} />
          </div>
        </>
      )}

      {tab === 'transactions' && (
        <>
          <TriageInboxWidget />

          <TransactionListWidget selectedMonth={selectedMonth} />
        </>
      )}

      {tab === 'setup' && (
        <>
          <CategoryManagerWidget selectedMonth={selectedMonth} />

          <ReallocationHistory selectedMonth={selectedMonth} />

          <CategorizationRulesWidget />
        </>
      )}

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
