import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAnalysisStore, type InvestmentAnalysis } from '../../store/useAnalysisStore'
import { AnalysisModal } from './AnalysisModal'
import { PositionCard } from './PositionCard'

interface AnalysisCardProps {
  analysis: InvestmentAnalysis
  totals: { plannedAll: number; currentAll: number }
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, totals }) => {
  const removeAnalysis = useAnalysisStore((s) => s.removeAnalysis)
  const [addOpen, setAddOpen] = useState(false)

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
        <p className="text-[13px] text-text-secondary">No positions yet — add one to start tracking.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {analysis.positions.map((p) => (
            <PositionCard key={p.id} analysisId={analysis.id} analysisDate={analysis.analysisDate} position={p} totals={totals} />
          ))}
        </div>
      )}

      <AnalysisModal isOpen={addOpen} onClose={() => setAddOpen(false)} analysisId={analysis.id} />
    </div>
  )
}
