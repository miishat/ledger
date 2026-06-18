import React, { useState } from 'react';
import { WidgetWrapper } from '../dashboard/WidgetWrapper';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Target } from 'lucide-react';
import { SetTargetModal } from './SetTargetModal';

export const InvestmentTrackerWidget: React.FC = () => {
  const { history, targetGoal } = useInvestmentStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <WidgetWrapper 
        title="Investment Tracker" 
        className="col-span-1 md:col-span-2 lg:col-span-2 min-h-[300px]"
        action={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 text-[12px] font-medium text-accent hover:opacity-80 transition-opacity"
          >
            <Target size={14} />
            Goal: ${targetGoal.toLocaleString()}
          </button>
        }
      >
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-primary)', 
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: 'var(--color-text-primary)' }}
                formatter={(value: number | string) => [`$${Number(value).toLocaleString()}`, '']}
                labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="actualBalance" 
                name="Actual"
                stroke="var(--color-primary)" 
                fillOpacity={1} 
                fill="url(#colorActual)" 
                strokeWidth={2}
                activeDot={{ r: 6, fill: 'var(--color-primary)' }}
              />
              <Line 
                type="monotone" 
                dataKey="targetBalance" 
                name="Target"
                stroke="var(--color-text-secondary)" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </WidgetWrapper>
      
      <SetTargetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
