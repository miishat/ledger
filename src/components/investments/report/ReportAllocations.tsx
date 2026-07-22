import React from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { PAAllocationRow, PAReport } from '../../../utils/investments/ibkrPortfolioAnalyst'
import { formatMoney } from '../../planner/format'
import { chartTooltipStyles } from '../../../utils/chartTheme'
import { Section } from './Section'

const SLICE_COLORS = [
  'var(--accent)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)',
]

const Donut: React.FC<{ title: string; rows: PAAllocationRow[] }> = ({ title, rows }) => {
  if (rows.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] uppercase tracking-wide text-text-secondary">{title}</p>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="endingNav" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} isAnimationActive={false}>
              {rows.map((r, i) => <Cell key={r.name} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />)}
            </Pie>
            <Tooltip {...chartTooltipStyles} formatter={(value) => formatMoney(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-1 text-[13px]">
        {rows.map((r, i) => (
          <div key={r.name} className="flex justify-between items-center gap-2">
            <span className="flex items-center gap-2 text-text-primary">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} />
              {r.name}
            </span>
            <span className="text-text-secondary shrink-0">{r.endingPct.toFixed(1)}% · {formatMoney(r.endingNav)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const ReportAllocations: React.FC<{ report: PAReport }> = ({ report }) => {
  const hasAny =
    report.assetClassAllocation.length > 0 ||
    report.sectorAllocation.length > 0 ||
    report.regionAllocation.length > 0
  if (!hasAny) return null

  return (
    <Section title="Allocations" defaultOpen>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Donut title="By Asset Class" rows={report.assetClassAllocation} />
        <Donut title="By Sector" rows={report.sectorAllocation} />
        <Donut title="By Region" rows={report.regionAllocation} />
      </div>
    </Section>
  )
}
