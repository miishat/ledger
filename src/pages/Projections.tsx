import React from 'react';
import { ProjectionWidget } from '../components/investments/ProjectionWidget';

export const Projections: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full h-full p-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-[24px] font-semibold text-text-primary">Future Projections</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            Forecast your future net worth based on compounding interest and savings rates.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <ProjectionWidget />
        </div>
      </div>
    </div>
  );
};
