import React, { useState } from 'react';
import { IncomeWidget } from '../components/budget/IncomeWidget';
import { ExpenseWidget } from '../components/budget/ExpenseWidget';
import { MonthlySummaryWidget } from '../components/budget/MonthlySummaryWidget';
import { TransactionModal } from '../components/budget/TransactionModal';
import { CSVUploader } from '../components/budget/CSVUploader';
import { TriageInboxWidget } from '../components/budget/TriageInboxWidget';

export const Budgeting: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-[24px] font-semibold text-text-primary">Budgeting Module</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Manage your income, track expenses, and view your cash flow.
          </p>
        </div>
        <div className="flex gap-4">
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
        <IncomeWidget />
        <ExpenseWidget />
        <MonthlySummaryWidget />
      </div>

      <TriageInboxWidget />

      <div className="mt-8 bg-bg-secondary border border-border rounded-xl p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-text-secondary text-[14px]">
          More detailed budgeting views and historical charts will go here in the future.
        </p>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
