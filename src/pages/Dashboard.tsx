import React from 'react';
import { BentoGrid } from '../components/dashboard/BentoGrid';
import { NetWorthWidget } from '../components/dashboard/widgets/NetWorthWidget';
import { AssetsWidget } from '../components/dashboard/widgets/AssetsWidget';
import { DebtsWidget } from '../components/dashboard/widgets/DebtsWidget';

export const Dashboard: React.FC = () => {
  return (
    <div className="p-6 h-full w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Master Dashboard</h1>
        <p className="text-text-secondary">Overview of your financial universe</p>
      </div>
      
      <BentoGrid>
        <NetWorthWidget />
        <AssetsWidget />
        <DebtsWidget />
      </BentoGrid>
    </div>
  );
};
