import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import {
  Line, LineChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { usePortfolioReportStore } from '../../store/usePortfolioReportStore'
import { formatMoney } from '../planner/format'
import { chartTooltipStyles } from '../../utils/chartTheme'

const Section: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="themed-card rounded-lg p-4">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 w-full text-left">
        {open ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronRight className="w-4 h-4 text-text-secondary" />}
        <h3 className="text-[14px] font-semibold text-text-primary">{title}</h3>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

export const PortfolioReport: React.FC = () => {
  const report = usePortfolioReportStore((s) => s.report)
  const uploadedAt = usePortfolioReportStore((s) => s.uploadedAt)
  const clearReport = usePortfolioReportStore((s) => s.clearReport)
  if (!report) return null

  // Benchmark chart: cumulative growth of 100 from monthly % returns.
  const seriesNames = ['Account', ...Object.keys(report.benchmarkSeries[0]?.benchmarks ?? {})]
  const cumulative: Record<string, number> = Object.fromEntries(seriesNames.map((n) => [n, 100]))
  const chartData = report.benchmarkSeries.map((p) => {
    cumulative['Account'] *= 1 + p.account / 100
    for (const [bm, r] of Object.entries(p.benchmarks)) cumulative[bm] *= 1 + r / 100
    return { month: p.month, ...Object.fromEntries(seriesNames.map((n) => [n, Number(cumulative[n].toFixed(2))])) }
  })
  const chartColors = ['var(--accent)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)']

  const stats = report.keyStats

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-text-primary">
          PortfolioAnalyst Report <span className="text-text-secondary font-normal text-[13px]">{report.period}</span>
        </h2>
        <button onClick={clearReport} className="flex items-center gap-1 text-[12px] text-text-secondary hover:text-error transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Clear report
        </button>
      </div>

      {stats && (
        <Section title="Key Statistics" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[13px]">
            {[
              ['Beginning NAV', formatMoney(stats.beginningNav)],
              ['Ending NAV', formatMoney(stats.endingNav)],
              ['Cumulative Return', pct(stats.cumulativeReturn)],
              ['Change in NAV', formatMoney(stats.changeInNav)],
              ['Deposits & Withdrawals', formatMoney(stats.depositsWithdrawals)],
              ['Dividends', formatMoney(stats.dividends)],
              ['Interest', formatMoney(stats.interest)],
              ['Fees & Commissions', formatMoney(stats.feesCommissions)],
              ['Best Day', `${pct(stats.bestReturn)} (${stats.bestReturnDate})`],
              ['Worst Day', `${pct(stats.worstReturn)} (${stats.worstReturnDate})`],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-[11px] uppercase tracking-wide text-text-secondary">{label}</p>
                <p className="font-medium text-text-primary">{value}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {chartData.length > 1 && (
        <Section title="Benchmark Comparison (growth of 100)" defaultOpen>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip {...chartTooltipStyles} />
                <Legend />
                {seriesNames.map((n, i) => (
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
      )}

      {(report.assetClassAllocation.length > 0 || report.sectorAllocation.length > 0 || report.regionAllocation.length > 0) && (
        <Section title="Allocations">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              ['By Asset Class', report.assetClassAllocation],
              ['By Sector', report.sectorAllocation],
              ['By Region', report.regionAllocation],
            ].map(([title, rows]) => (
              <div key={title as string} className="flex flex-col gap-2">
                <p className="text-[12px] uppercase tracking-wide text-text-secondary">{title as string}</p>
                {(rows as { name: string; endingNav: number; endingPct: number }[]).map((a) => (
                  <div key={a.name} className="flex flex-col gap-1 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-text-primary">{a.name}</span>
                      <span className="text-text-secondary">{a.endingPct.toFixed(1)}% · {formatMoney(a.endingNav)}</span>
                    </div>
                    <div className="h-1.5 rounded bg-bg-primary/50 overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, a.endingPct))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}

      {report.performanceBySymbol.length > 0 && (
        <Section title={`Performance by Symbol (${report.performanceBySymbol.length})`}>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-[12px] min-w-[720px]">
              <thead><tr className="text-left text-text-secondary border-b border-border sticky top-0 bg-[var(--card-bg)]">
                {['Symbol', 'Sector', 'Avg Weight', 'Return', 'Contribution', 'Unrealized P/L', 'Realized P/L', 'Open'].map((h) => (
                  <th key={h} className="py-1.5 pr-3 font-medium">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[...report.performanceBySymbol].sort((a, b) => b.contribution - a.contribution).map((s) => (
                  <tr key={`${s.symbol}-${s.instrument}`} className="border-b border-border/50">
                    <td className="py-1.5 pr-3 text-text-primary" title={s.description}>{s.symbol}</td>
                    <td className="py-1.5 pr-3 text-text-secondary">{s.sector}</td>
                    <td className="py-1.5 pr-3">{s.avgWeight.toFixed(2)}%</td>
                    <td className={`py-1.5 pr-3 ${s.totalReturn >= 0 ? 'text-accent' : 'text-error'}`}>{pct(s.totalReturn)}</td>
                    <td className={`py-1.5 pr-3 ${s.contribution >= 0 ? 'text-accent' : 'text-error'}`}>{pct(s.contribution)}</td>
                    <td className={`py-1.5 pr-3 ${s.unrealizedPl >= 0 ? 'text-accent' : 'text-error'}`}>{formatMoney(s.unrealizedPl)}</td>
                    <td className={`py-1.5 pr-3 ${s.realizedPl >= 0 ? 'text-accent' : 'text-error'}`}>{formatMoney(s.realizedPl)}</td>
                    <td className="py-1.5 pr-3 text-text-secondary">{s.open ? 'Yes' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {(report.dividends.length > 0 || report.projectedIncome.length > 0) && (
        <Section title="Dividends & Projected Income">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
            <div>
              <p className="text-[12px] uppercase tracking-wide text-text-secondary mb-2">
                Received ({formatMoney(report.dividends.reduce((s, d) => s + d.amount, 0))})
              </p>
              {report.dividends.map((d, i) => (
                <div key={i} className="flex justify-between py-0.5">
                  <span className="text-text-primary">{d.symbol} <span className="text-text-secondary">{d.payDate}</span></span>
                  <span>{formatMoney(d.amount)}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-wide text-text-secondary mb-2">
                Projected annual ({formatMoney(report.projectedIncome.reduce((s, p) => s + p.estAnnualIncome, 0))})
              </p>
              {report.projectedIncome.map((p, i) => (
                <div key={i} className="flex justify-between py-0.5">
                  <span className="text-text-primary">{p.symbol} <span className="text-text-secondary">{p.frequency}, {p.currentYieldPct.toFixed(2)}%</span></span>
                  <span>{formatMoney(p.estAnnualIncome)}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {report.fees.length > 0 && (
        <Section title={`Fees (${formatMoney(report.fees.reduce((s, f) => s + f.amount, 0))} net)`}>
          <div className="max-h-[240px] overflow-y-auto text-[13px]">
            {report.fees.map((f, i) => (
              <div key={i} className="flex justify-between py-0.5">
                <span className="text-text-secondary">{f.date} <span className="text-text-primary">{f.description}</span></span>
                <span className={f.amount >= 0 ? 'text-accent' : 'text-error'}>{formatMoney(f.amount)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <p className="text-[12px] text-text-secondary">
        Report uploaded {uploadedAt ? new Date(uploadedAt).toLocaleString() : ''} · base currency {report.baseCurrency}
      </p>
    </div>
  )
}
