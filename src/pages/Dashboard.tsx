import React from 'react';
import { BentoGrid } from '../components/dashboard/BentoGrid';
import { NetWorthWidget } from '../components/dashboard/widgets/NetWorthWidget';
import { IncomeWidget } from '../components/budget/IncomeWidget';
import { ExpenseWidget } from '../components/budget/ExpenseWidget';
import { MonthlySummaryWidget } from '../components/budget/MonthlySummaryWidget';
import { AccountCategoryWidget } from '../components/dashboard/AccountCategoryWidget';
import { CSVUploader } from '../components/budget/CSVUploader';
import { TriageInboxWidget } from '../components/budget/TriageInboxWidget';

export const Dashboard: React.FC = () => {
  return (
    <div className="p-6 h-full w-full">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Dashboard</h1>
          <p className="text-text-secondary">Overview of your financial universe</p>
        </div>
        <CSVUploader />
      </div>
      
      <BentoGrid>
        <TriageInboxWidget />
        <NetWorthWidget />
        <MonthlySummaryWidget />
        
        <AccountCategoryWidget title="Bank Accounts" type="bank" />
        <AccountCategoryWidget title="Investment Accounts" type="investment" />
        
        <IncomeWidget />
        <ExpenseWidget />
        
        <AccountCategoryWidget title="Receivables" type="receivable" />
        <AccountCategoryWidget title="Others" type="other" />
        <AccountCategoryWidget title="Debts & Liabilities" type="debt" />
      </BentoGrid>
    </div>
  );
};

