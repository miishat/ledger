import React from 'react'
import { Trash2 } from 'lucide-react'
import { usePortfolioReportStore } from '../../../store/usePortfolioReportStore'
import { formatMoney } from '../../planner/format'
import { ReportPerformance } from './ReportPerformance'
import { ReportIncome } from './ReportIncome'
import { ReportFees } from './ReportFees'
import { Section, pct } from './Section'

export const PortfolioReport: React.FC = () => {
  const report = usePortfolioReportStore((s) => s.report)
  const uploadedAt = usePortfolioReportStore((s) => s.uploadedAt)
  const clearReport = usePortfolioReportStore((s) => s.clearReport)
  if (!report) return null

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

      {/* Key Statistics, Allocations and Performance by Symbol are lifted
          verbatim from the pre-split file and replaced in Tasks 15 and 16. */}

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

      <ReportPerformance report={report} />

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

      <ReportIncome report={report} />
      <ReportFees report={report} />

      <p className="text-[12px] text-text-secondary">
        Report uploaded {uploadedAt ? new Date(uploadedAt).toLocaleString() : ''} · base currency {report.baseCurrency}
      </p>
    </div>
  )
}
