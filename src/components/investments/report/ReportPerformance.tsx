import React from 'react'
import { Line, LineChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PAReport } from '../../../utils/investments/ibkrPortfolioAnalyst'
import { chartTooltipStyles } from '../../../utils/chartTheme'
import { growthSeries } from './reportMetrics'
import { Section, pct } from './Section'

const chartColors = ['var(--accent)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)']

export const ReportPerformance: React.FC<{ report: PAReport }> = ({ report }) => {
  const { names, data } = growthSeries(report.benchmarkSeries)
  if (data.length <= 1) return null
  return (
    <Section title="Benchmark Comparison (growth of 100)" defaultOpen>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} />
            <YAxis stroke="var(--text-secondary)" fontSize={11} domain={['auto', 'auto']} />
            <Tooltip {...chartTooltipStyles} />
            <Legend />
            {names.map((n, i) => (
              <Line key={n} type="monotone" dataKey={n} stroke={chartColors[i % chartColors.length]} strokeWidth={n === 'Account' ? 2 : 1.5} dot={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {report.benchmarkSummary.length > 0 && (
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-[12px] min-w-[560px]">
            <thead><tr className="text-left text-text-secondary border-b border-border">
              {['', 'MTD', 'QTD', 'YTD', '1Y', '3Y', '5Y', 'Incept.'].map((h) => <th key={h} className="py-1 pr-3 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {report.benchmarkSummary.map((r) => (
                <tr key={r.name} className="border-b border-border/50">
                  <td className="py-1 pr-3 text-text-primary">{r.name}</td>
                  {[r.mtd, r.qtd, r.ytd, r.oneYear, r.threeYear, r.fiveYear, r.inception].map((v, i) => (
                    <td key={i} className={`py-1 pr-3 ${v >= 0 ? 'text-accent' : 'text-error'}`}>{pct(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}
