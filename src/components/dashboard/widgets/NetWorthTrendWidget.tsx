import React from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { WidgetWrapper } from '../WidgetWrapper'
import { useAccountsStore } from '../../../store/useAccountsStore'
import { formatMoney } from '../../planner/format'
import { chartTooltipStyles } from '../../../utils/chartTheme'

/** Brokerage-style axis: track the data range with headroom, never force zero. */
export function trendDomain(values: number[]): [number, number] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const pad = range > 0 ? range * 0.08 : Math.max(Math.abs(max) * 0.05, 1)
  return [min - pad, max + pad]
}

export const NetWorthTrendWidget: React.FC = () => {
  const history = useAccountsStore((s) => s.history)
  if (history.length < 2) {
    return (
      <WidgetWrapper title="Net Worth Over Time" className="md:col-span-2">
        <p className="text-[13px] text-text-secondary mt-2">
          Update your accounts a few times: each change records a snapshot and the trend appears here.
        </p>
      </WidgetWrapper>
    )
  }
  const domain = trendDomain(history.map((h) => h.value))
  return (
    <WidgetWrapper title="Net Worth Over Time" className="md:col-span-2">
      <div className="h-[220px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} minTickGap={40} />
            <YAxis width={70} domain={domain} allowDataOverflow={false} tickFormatter={(v: number) => formatMoney(v)} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [formatMoney(Number(value)), 'Net worth']}
              {...chartTooltipStyles}
            />
            <Area type="monotone" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </WidgetWrapper>
  )
}
