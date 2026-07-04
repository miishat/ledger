import React from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { WidgetWrapper } from '../WidgetWrapper'
import { useAccountsStore } from '../../../store/useAccountsStore'
import { formatMoney } from '../../planner/format'

export const NetWorthTrendWidget: React.FC = () => {
  const history = useAccountsStore((s) => s.history)
  if (history.length < 2) {
    return (
      <WidgetWrapper title="Net worth over time" className="md:col-span-2">
        <p className="text-[13px] text-text-secondary mt-2">
          Update your accounts a few times — each change records a snapshot and the trend appears here.
        </p>
      </WidgetWrapper>
    )
  }
  return (
    <WidgetWrapper title="Net worth over time" className="md:col-span-2">
      <div className="h-[220px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} minTickGap={40} />
            <YAxis width={70} tickFormatter={(v: number) => formatMoney(v)} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [formatMoney(Number(value)), 'Net worth']}
              contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            <Area type="monotone" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </WidgetWrapper>
  )
}
