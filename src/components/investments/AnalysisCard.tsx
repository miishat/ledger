import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAnalysisStore, type InvestmentAnalysis } from '../../store/useAnalysisStore'
import { AnalysisModal } from './AnalysisModal'
import { PositionCard } from './PositionCard'
import { FundSummaryBar } from './FundSummaryBar'
import { PlanTable } from './PlanTable'
import { ActualTable } from './ActualTable'
import { SwapSimulator } from './SwapSimulator'
import { planFundSummary, planRow, actualFundSummary } from '../../utils/investments/planMetrics'
import { useResolvedPriceFor } from '../../utils/investments/priceFor'
import { totalInvested } from '../../utils/investments/analysisMetrics'
import type { Position } from '../../store/useAnalysisStore'

interface AnalysisCardProps {
  analysis: InvestmentAnalysis
  totals: { plannedAll: number; currentAll: number }
}

const fundInputCls =
  'bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[14px] outline-none focus:border-accent w-full'

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, totals }) => {
  const removeAnalysis = useAnalysisStore((s) => s.removeAnalysis)
  const updateAnalysis = useAnalysisStore((s) => s.updateAnalysis)
  const updatePosition = useAnalysisStore((s) => s.updatePosition)
  const [addOpen, setAddOpen] = useState(false)
  const [subTab, setSubTab] = useState<'plan' | 'actual'>('plan')
  const priceFor = useResolvedPriceFor()

  return (
    <div className="themed-card rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[17px] font-semibold text-text-primary">{analysis.name}</h3>
          <p className="text-[12px] text-text-secondary">
            Analyzed {analysis.analysisDate} · {analysis.positions.length} position{analysis.positions.length === 1 ? '' : 's'}
          </p>
          {analysis.thesis && <p className="text-[13px] text-text-secondary mt-1 italic">{analysis.thesis}</p>}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setAddOpen(true)} aria-label="Add position" className="flex items-center gap-1 p-1.5 text-[13px] text-text-secondary hover:text-accent">
            <Plus className="w-4 h-4" /> Position
          </button>
          <button onClick={() => removeAnalysis(analysis.id)} aria-label="Delete analysis" className="p-1.5 text-text-secondary hover:text-error">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {analysis.positions.length === 0 ? (
        <p className="text-[13px] text-text-secondary">No positions yet. Add one to start tracking.</p>
      ) : (
        <>
          <div className="flex gap-2">
            {(['plan', 'actual'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSubTab(t)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${
                  subTab === t ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {t === 'plan' ? 'Plan' : 'Actual'}
              </button>
            ))}
          </div>

          {subTab === 'plan' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[13px] text-text-secondary">Initial fund ($)</span>
                  <input
                    type="number"
                    className={fundInputCls}
                    value={analysis.initialFund ?? 0}
                    onChange={(e) => updateAnalysis(analysis.id, { initialFund: Number(e.target.value) })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[13px] text-text-secondary">Extra fund ($)</span>
                  <input
                    type="number"
                    className={fundInputCls}
                    value={analysis.extraFund ?? 0}
                    onChange={(e) => updateAnalysis(analysis.id, { extraFund: Number(e.target.value) })}
                  />
                </label>
              </div>
              <FundSummaryBar
                summary={planFundSummary(
                  analysis.positions.map((p) => planRow(p, analysis.initialFund ?? 0, priceFor(p))),
                  analysis.initialFund ?? 0,
                  analysis.extraFund ?? 0,
                )}
                startDate={analysis.analysisDate}
              />
              <SwapSimulator
                analysis={analysis}
                side="plan"
                priceFor={priceFor}
                investedFor={(p: Position) => {
                  const row = planRow(p, analysis.initialFund ?? 0, priceFor(p))
                  return row.initialInvestment + row.extra
                }}
              />
              <div className="flex flex-col gap-2">
                {analysis.positions.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-end gap-2 text-[13px]">
                    <span className="text-text-secondary w-16">{p.ticker}</span>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] text-text-secondary">Allocation %</span>
                      <input
                        type="number"
                        className={`${fundInputCls} w-28`}
                        value={p.allocationPct ?? 0}
                        onChange={(e) => updatePosition(analysis.id, p.id, { allocationPct: Number(e.target.value) })}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] text-text-secondary">Extra planned $</span>
                      <input
                        type="number"
                        className={`${fundInputCls} w-28`}
                        value={p.extraPlanned ?? 0}
                        onChange={(e) => updatePosition(analysis.id, p.id, { extraPlanned: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                ))}
              </div>
              <PlanTable analysis={analysis} priceFor={priceFor} />
            </>
          ) : (
            <>
              <FundSummaryBar summary={actualFundSummary(analysis.positions, priceFor)} startDate={analysis.analysisDate} />
              <SwapSimulator
                analysis={analysis}
                side="actual"
                priceFor={priceFor}
                investedFor={(p: Position) => totalInvested(p.lots)}
              />
              <ActualTable analysis={analysis} priceFor={priceFor} />
            </>
          )}

          <div className="flex flex-col gap-3">
            {analysis.positions.map((p) => (
              <PositionCard key={p.id} analysisId={analysis.id} analysisDate={analysis.analysisDate} position={p} totals={totals} />
            ))}
          </div>
        </>
      )}

      <AnalysisModal isOpen={addOpen} onClose={() => setAddOpen(false)} analysisId={analysis.id} />
    </div>
  )
}
