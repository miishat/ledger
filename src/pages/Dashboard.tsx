import React from 'react';
import { BentoGrid } from '../components/dashboard/BentoGrid';
import { WidgetWrapper } from '../components/dashboard/WidgetWrapper';

export const Dashboard: React.FC = () => {
  return (
    <div className="p-6 h-full w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Master Dashboard</h1>
        <p className="text-text-secondary">Overview of your financial universe</p>
      </div>
      
      <BentoGrid>
        <WidgetWrapper title="Placeholder Widget 1">
          <div className="h-48 flex items-center justify-center text-text-secondary border-2 border-dashed border-border rounded-lg">
            Widget Content
          </div>
        </WidgetWrapper>
        <WidgetWrapper title="Placeholder Widget 2">
          <div className="h-48 flex items-center justify-center text-text-secondary border-2 border-dashed border-border rounded-lg">
            Widget Content
          </div>
        </WidgetWrapper>
      </BentoGrid>
    </div>
  );
};
