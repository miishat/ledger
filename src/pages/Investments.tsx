import React from 'react';
import { InvestmentTrackerWidget } from '../components/investments/InvestmentTrackerWidget';

export const Investments: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full h-full p-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-[24px] font-semibold text-text-primary">Investment Tracker</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Compare your target vs actual investments over time.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <InvestmentTrackerWidget />
        </div>
      </div>

      <div className="mt-8 bg-bg-secondary border border-border rounded-xl p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-text-secondary text-[14px]">
          More detailed investment views and historical charts will go here in the future.
        </p>
      </div>
    </div>
  );
};
