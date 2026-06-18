import React from 'react';
import { WidgetWrapper } from '../WidgetWrapper';
import { useDashboardStore } from '../../../store/useDashboardStore';

export const DebtsWidget: React.FC = () => {
  const { totalDebts } = useDashboardStore();

  return (
    <WidgetWrapper title="Total Liabilities">
      <div className="flex flex-col justify-center h-full pt-4">
        <div className="text-[28px] font-bold text-text-primary">
          ${totalDebts.toLocaleString()}
        </div>
        <p className="text-text-secondary text-sm mt-1">Across all loans and credit</p>
      </div>
    </WidgetWrapper>
  );
};
