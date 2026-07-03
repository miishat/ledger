import React from 'react'
import {
  Area, ComposedChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { NetWorthSnapshot } from '../../../store/useAccountsStore'
import type { ForecastPoint } from '../../../utils/finance/forecast'
import { formatMoney } from '../format'

interface GoalMarker {
  label: string
  month: number | null
  amount: number
}

interface ForecastChartProps {
  points: ForecastPoint[]
  history: NetWorthSnapshot[]
  showReal: boolean
  view: 'line' | 'stacked'
  goalMarkers: GoalMarker[]
}

function monthsAgo(date: string): number {
  const d = new Date(`${date}T00:00:00`)
  const now = new Date()
  return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth())
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ points, history, showReal, view, goalMarkers }) => {
  const past = history
    .map((h) => ({ month: monthsAgo(h.date), actual: h.value }))
    .filter((p) => p.month < 0)
  // Downsample forecast to quarterly points to keep the chart light.
  const future = points
    .filter((p) => p.month % 3 === 0)
    .map((p) => ({
      month: p.month,
      projected: Math.round(showReal ? p.real : p.base),
      conservative: Math.round(p.conservative),
      optimistic: Math.round(p.optimistic),
      contributed: Math.round(p.contributed),
      growth: Math.round(Math.max(0, p.growth)),
    }))
  const data = [...past, ...future]

  const axisProps = {
    stroke: 'var(--text-secondary)',
    tick: { fill: 'var(--text-secondary)', fontSize: 12 },
  }

  return (
    <div className="themed-card rounded-lg p-4 h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(m: number) => `${(m / 12).toFixed(0)}y`}
            {...axisProps}
          />
          <YAxis width={72} tickFormatter={(v: number) => formatMoney(v)} {...axisProps} />
          <Tooltip
            labelFormatter={(m) => {
              const month = Number(m)
              return month < 0 ? `${-month}mo ago` : `+${(month / 12).toFixed(1)}y`
            }}
            formatter={(value, name) => [formatMoney(Number(value)), String(name)]}
            contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
          <ReferenceLine x={0} stroke="var(--text-secondary)" strokeDasharray="4 4" label={{ value: 'today', fill: 'var(--text-secondary)', fontSize: 11 }} />
          {view === 'line' ? (
            <>
              <Area type="monotone" dataKey="optimistic" stroke="none" fill="var(--accent)" fillOpacity={0.12} name="Optimistic" />
              <Area type="monotone" dataKey="conservative" stroke="none" fill="var(--bg-primary)" fillOpacity={0.9} name="Conservative" />
              <Line type="monotone" dataKey="projected" stroke="var(--accent)" strokeWidth={2} dot={false} name={showReal ? 'Projected (real)' : 'Projected'} />
            </>
          ) : (
            <>
              <Area type="monotone" dataKey="contributed" stackId="s" stroke="var(--text-secondary)" fill="var(--text-secondary)" fillOpacity={0.25} name="Contributed" />
              <Area type="monotone" dataKey="growth" stackId="s" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.35} name="Growth" />
            </>
          )}
          <Line type="monotone" dataKey="actual" stroke="var(--text-primary)" strokeWidth={2} dot={false} name="Actual" />
          {goalMarkers
            .filter((g) => g.month !== null)
            .map((g) => (
              <ReferenceLine
                key={g.label}
                x={g.month as number}
                stroke="var(--accent)"
                strokeDasharray="2 4"
                label={{ value: g.label, fill: 'var(--accent)', fontSize: 11, position: 'top' }}
              />
            ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
