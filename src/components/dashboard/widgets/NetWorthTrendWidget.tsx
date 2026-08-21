import React, { useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { WidgetWrapper } from '../WidgetWrapper'
import { useAccountsStore } from '../../../store/useAccountsStore'
import { formatMoney, formatMoneyCompact } from '../../planner/format'
import { chartTooltipStyles } from '../../../utils/chartTheme'
import { trendDomain } from './trendDomain'
import { NetWorthHistorySheet } from './NetWorthHistorySheet'
import { ChartFigure } from '../../ui/ChartFigure'

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
      <ChartFigure
        label={`Net worth over time from ${history[0]?.date ?? ''} to ${history[history.length - 1]?.date ?? ''}, from ${formatMoneyCompact(history[0]?.value ?? 0)} to ${formatMoneyCompact(history[history.length - 1]?.value ?? 0)}`}
        className="h-[220px] mt-2"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            {/* The axes meet at the corner, so a full-precision y label like
                $316,621 sits directly against the first date and the two read as
                one string. Compact labels keep the corner legible, and match the
                axis formatting every other chart in the app uses. */}
            <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} minTickGap={40} tickMargin={14} />
            <YAxis width={48} domain={domain} allowDataOverflow={false} tickFormatter={(v: number) => formatMoneyCompact(v)} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickMargin={6} />
            <Tooltip
              formatter={(value) => [formatMoney(Number(value)), 'Net worth']}
              {...chartTooltipStyles}
            />
            <Area type="monotone" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFigure>
      <NetWorthHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </WidgetWrapper>
  )
}
