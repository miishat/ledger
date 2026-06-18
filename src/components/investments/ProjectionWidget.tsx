import React from 'react';
import { WidgetWrapper } from '../dashboard/WidgetWrapper';
import { useProjectionStore } from '../../store/useProjectionStore';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const ProjectionWidget: React.FC = () => {
  const {
    horizon,
    monthlyContribution,
    marketReturn,
    inflation,
    history,
    setHorizon,
    setMonthlyContribution,
    setMarketReturn,
    setInflation,
  } = useProjectionStore();

  const formatCurrency = (value: number | string) => {
    if (typeof value !== 'number') return String(value);
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  return (
    <WidgetWrapper title="Future Projections" className="col-span-12 lg:col-span-8 flex flex-col min-h-[500px]">
      <div className="flex flex-wrap gap-2 mb-4">
        {[10, 20, 30].map((years) => (
          <button
            key={years}
            onClick={() => setHorizon(years as 10 | 20 | 30)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              horizon === years
                ? 'bg-accent text-bg-primary'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {years} Years
          </button>
        ))}
      </div>

      <div className="flex-1 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <ComposedChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
            <XAxis dataKey="year" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatCurrency} stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value: number | string) => {
                if (typeof value !== 'number') return String(value);
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
              }}
              contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Area
              type="monotone"
              dataKey="baseContribution"
              stackId="1"
              stroke="var(--text-secondary)"
              fill="var(--bg-secondary)"
              name="Contributions"
            />
            <Area
              type="monotone"
              dataKey="interest"
              stackId="1"
              stroke="var(--accent)"
              fill="url(#colorInterest)"
              name="Compounded Interest"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Monthly Contribution ($)</label>
          <input
            type="number"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Market Return (%)</label>
          <input
            type="number"
            value={marketReturn}
            onChange={(e) => setMarketReturn(Number(e.target.value))}
            className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Inflation (%)</label>
          <input
            type="number"
            value={inflation}
            onChange={(e) => setInflation(Number(e.target.value))}
            className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>
    </WidgetWrapper>
  );
};
