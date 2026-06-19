import React from 'react';
import { WidgetWrapper } from '../WidgetWrapper';
import { useAccountsStore } from '../../../store/useAccountsStore';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const NetWorthWidget: React.FC = () => {
  const { getNetWorth, getNetWorthTrend } = useAccountsStore();
  
  const netWorth = getNetWorth();
  const netWorthTrend = getNetWorthTrend();
  const isPositive = netWorthTrend >= 0;

  return (
    <WidgetWrapper title="Net Worth" className="col-span-1 md:col-span-2 lg:col-span-1">
      <div className="flex flex-col justify-center h-full pt-4">
        <div className="text-[36px] font-bold leading-[1.1] text-text-primary mb-2">
          ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center text-accent font-medium">
          {isPositive ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1 text-red-500" />}
          <span className={isPositive ? '' : 'text-red-500'}>
            {isPositive ? '+' : ''}{netWorthTrend}%
          </span>
          <span className="text-text-secondary ml-2 font-normal text-sm">vs last month</span>
        </div>
      </div>
    </WidgetWrapper>
  );
};
