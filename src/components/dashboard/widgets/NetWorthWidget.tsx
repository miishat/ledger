import React from 'react';
import { WidgetWrapper } from '../WidgetWrapper';
import { useAccountsStore } from '../../../store/useAccountsStore';
import { AnimatedNumber } from '../../ui/AnimatedNumber';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const NetWorthWidget: React.FC = () => {
  const { getNetWorth, getNetWorthTrend } = useAccountsStore();
  const history = useAccountsStore((s) => s.history);

  const netWorth = getNetWorth();
  const netWorthTrend = getNetWorthTrend();
  const isPositive = netWorthTrend >= 0;

  // Mirrors getNetWorthTrend's own notion of "a real figure": the most
  // recent snapshot at or before the end of last month must exist and be
  // non-zero. A naive "does any snapshot before the cutoff have a non-zero
  // value" check can disagree with that (an older non-zero snapshot behind a
  // newer zero-valued one), so this reuses the same most-recent-match logic
  // rather than a plain .some().
  const now = new Date();
  const endOfLastMonth = new Date(new Date(now.getFullYear(), now.getMonth(), 1).getTime() - 1)
    .toISOString().split('T')[0];
  const pastSnapshot = [...history].reverse().find((h) => h.date <= endOfLastMonth);
  const hasComparison = pastSnapshot !== undefined && pastSnapshot.value !== 0;

  return (
    <WidgetWrapper title="Net Worth" className="col-span-1 md:col-span-2 lg:col-span-1">
      <div className="flex flex-col justify-center h-full pt-4">
        <div className="text-[36px] font-bold leading-[1.1] text-text-primary mb-2">
          <AnimatedNumber
            value={netWorth}
            format={(n) => `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
        </div>
        {hasComparison ? (
          <div className="flex items-center text-accent font-medium">
            {isPositive ? <TrendingUp size={16} className="mr-1" aria-hidden="true" /> : <TrendingDown size={16} className="mr-1 text-error" aria-hidden="true" />}
            <span className={isPositive ? '' : 'text-error'}>
              {isPositive ? '+' : ''}{netWorthTrend.toFixed(2)}%
            </span>
            <span className="text-text-secondary ml-2 font-normal text-sm">vs Last Month</span>
          </div>
        ) : (
          // A green up-arrow reading "+0.00%" on a brand-new install reported
          // growth that never happened. Say there is nothing to compare to.
          <div className="text-text-secondary font-normal text-sm">No comparison for last month yet</div>
        )}
      </div>
    </WidgetWrapper>
  );
};
