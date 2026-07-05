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
import { CashFlowForecastWidget } from '../components/budget/CashFlowForecastWidget';
import { SankeyWidget } from '../components/budget/SankeyWidget';
import { SpendingHeatmapWidget } from '../components/budget/SpendingHeatmapWidget';
import { CategoryTrendsWidget } from '../components/budget/CategoryTrendsWidget';
import { BudgetProgressWidget } from '../components/budget/BudgetProgressWidget';
import { useBudgetStore } from '../store/useBudgetStore';

export const Budgeting: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const categories = useBudgetStore((state) => state.categories);
  const seedDefaults = useBudgetStore((state) => state.seedDefaults);

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));

  const shiftMonth = (delta: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    setSelectedMonth(date.toISOString().substring(0, 7));
  };
  
  const formattedMonth = new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  React.useEffect(() => {
    if (Object.keys(categories).length === 0) {
      seedDefaults();
    }
  }, [categories, seedDefaults]);

  return (
    <div className="flex flex-col gap-6 w-full min-h-full p-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-[24px] font-semibold text-text-primary">Budgeting Module</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Manage your income, track expenses, and view your cash flow.
          </p>
        </div>
        <div className="flex gap-4 items-center">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <IncomeWidget selectedMonth={selectedMonth} />
        <ExpenseWidget selectedMonth={selectedMonth} />
        <MonthlySummaryWidget selectedMonth={selectedMonth} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SubscriptionsWidget />
        <AnomalyAlertsWidget selectedMonth={selectedMonth} />
        <CashFlowForecastWidget selectedMonth={selectedMonth} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BudgetProgressWidget selectedMonth={selectedMonth} />
        <SpendingHeatmapWidget selectedMonth={selectedMonth} />
        <CategoryTrendsWidget selectedMonth={selectedMonth} />
        <SankeyWidget selectedMonth={selectedMonth} />
      </div>

      <TriageInboxWidget />
      
      <CategorizationRulesWidget />

      <CategoryManagerWidget selectedMonth={selectedMonth} />

      <TransactionListWidget selectedMonth={selectedMonth} />

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
