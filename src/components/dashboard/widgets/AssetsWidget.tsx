import React from 'react';
import { WidgetWrapper } from '../WidgetWrapper';
import { useDashboardStore } from '../../../store/useDashboardStore';

export const AssetsWidget: React.FC = () => {
  const { totalAssets } = useDashboardStore();

  return (
    <WidgetWrapper title="Total Assets">
      <div className="flex flex-col justify-center h-full pt-4">
        <div className="text-[28px] font-bold text-text-primary">
          ${totalAssets.toLocaleString()}
        </div>
        <p className="text-text-secondary text-sm mt-1">Across all accounts</p>
      </div>
    </WidgetWrapper>
  );
};
