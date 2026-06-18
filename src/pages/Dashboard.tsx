import React, { useState } from 'react';
import { BentoGrid } from '../components/dashboard/BentoGrid';
import { NetWorthWidget } from '../components/dashboard/widgets/NetWorthWidget';
import { AssetsWidget } from '../components/dashboard/widgets/AssetsWidget';
import { DebtsWidget } from '../components/dashboard/widgets/DebtsWidget';
import { IncomeWidget } from '../components/budget/IncomeWidget';
import { ExpenseWidget } from '../components/budget/ExpenseWidget';
import { CashFlowWidget } from '../components/budget/CashFlowWidget';
import { TransactionModal } from '../components/budget/TransactionModal';
import { InvestmentTrackerWidget } from '../components/investments/InvestmentTrackerWidget';
import { ProjectionWidget } from '../components/investments/ProjectionWidget';

export const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6 h-full w-full">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Dashboard</h1>
          <p className="text-text-secondary">Overview of your financial universe</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-accent text-white px-4 py-2 rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
        >
          Add Transaction
        </button>
      </div>
      
      <BentoGrid>
        <NetWorthWidget />
        <CashFlowWidget />
        <InvestmentTrackerWidget />
        <AssetsWidget />
        <IncomeWidget />
        <ExpenseWidget />
        <DebtsWidget />
        <ProjectionWidget />
      </BentoGrid>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
