import React, { useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { WidgetWrapper } from '../WidgetWrapper'
import { useAccountsStore } from '../../../store/useAccountsStore'
import { formatMoney } from '../../planner/format'
import { chartTooltipStyles } from '../../../utils/chartTheme'
import { trendDomain } from './trendDomain'
import { NetWorthHistorySheet } from './NetWorthHistorySheet'

export const NetWorthTrendWidget: React.FC = () => {
  const history = useAccountsStore((s) => s.history)
  const [historyOpen, setHistoryOpen] = useState(false)

  const editHistoryAction = (
    <button
      type="button"
      onClick={() => setHistoryOpen(true)}
      className="text-[12px] text-text-secondary hover:text-accent transition-colors"
    >
      Edit history
    </button>
  )

  if (history.length < 2) {
    return (
      <WidgetWrapper title="Net Worth Over Time" className="md:col-span-2" action={editHistoryAction}>
        <p className="text-[13px] text-text-secondary mt-2">
          Add a few dated figures with Edit history, or update your accounts, and the trend appears here.
        </p>
        <NetWorthHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
      </WidgetWrapper>
    )
  }
  const domain = trendDomain(history.map((h) => h.value))
  return (
    <WidgetWrapper title="Net Worth Over Time" className="md:col-span-2" action={editHistoryAction}>
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
      <NetWorthHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </WidgetWrapper>
  )
}
