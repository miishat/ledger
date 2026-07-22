import React from 'react'
import { Trash2 } from 'lucide-react'
import { usePortfolioReportStore } from '../../../store/usePortfolioReportStore'
import { formatMoney } from '../../planner/format'
import { ReportSummary } from './ReportSummary'
import { ReportAllocations } from './ReportAllocations'
import { ReportPerformance } from './ReportPerformance'
import { ReportIncome } from './ReportIncome'
import { ReportFees } from './ReportFees'
import { Section, pct } from './Section'

export const PortfolioReport: React.FC = () => {
  const report = usePortfolioReportStore((s) => s.report)
  const uploadedAt = usePortfolioReportStore((s) => s.uploadedAt)
  const clearReport = usePortfolioReportStore((s) => s.clearReport)
  if (!report) return null

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

      {/* Performance by Symbol is lifted verbatim from the pre-split file
          and replaced in Task 16. */}

      <ReportSummary report={report} />

      <ReportPerformance report={report} />

      <ReportAllocations report={report} />

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
