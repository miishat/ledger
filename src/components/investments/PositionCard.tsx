import React, { useState } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useCurrentPrice } from '../../services/marketData'
import { useAnalysisStore, type Position } from '../../store/useAnalysisStore'
import {
  allocationPct, avgCostBasis, counterfactualValue, currentValue,
  plDollars, plPct, thesisChangePct, totalInvested, variance,
} from '../../utils/investments/analysisMetrics'
import { formatMoney } from '../planner/format'
import { ThemedDatePicker } from '../ui/ThemedDatePicker'

interface PositionCardProps {
  analysisId: string
  analysisDate: string
  position: Position
  totals: { plannedAll: number; currentAll: number }
}

const pct = (v: number | null) => (v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`)

export const PositionCard: React.FC<PositionCardProps> = ({ analysisId, analysisDate, position, totals }) => {
  const { updatePosition, removePosition, addLot, removeLot } = useAnalysisStore.getState()
  const price = useCurrentPrice(position.ticker, position.exchange)
  const currentPrice = price.data?.value.price ?? position.startPrice
  const [lotAmount, setLotAmount] = useState(1000)
  const [lotPrice, setLotPrice] = useState(currentPrice)
  const [lotDate, setLotDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [manualPriceDraft, setManualPriceDraft] = useState('')
  const isOverridden = price.data?.source === 'override'

  const handleManualPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = Number(manualPriceDraft)
    if (Number.isFinite(parsed) && parsed > 0) {
      price.setManual(parsed)
      setManualPriceDraft('')
    }
  }

  const invested = totalInvested(position.lots)
  const value = currentValue(position.lots, currentPrice)
  const counterfactual = counterfactualValue(position.plannedAmount, position.startPrice, currentPrice)

  return (
    <div className="border border-border rounded-lg p-3 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-[15px] font-semibold text-text-primary">
            {position.ticker}
            {position.exchange ? <span className="text-text-secondary text-[13px]"> · {position.exchange}</span> : null}
          </h4>
          <p className="text-[12px] text-text-secondary">
            Analyzed {analysisDate} at {position.startPrice.toFixed(2)} ({position.startPriceSource}) ·
            now {currentPrice.toFixed(2)}
            {price.data ? ` (${price.data.source}${price.data.stale ? ', stale' : ''})` : ''}
            <span className="text-accent"> {pct(thesisChangePct(position.startPrice, currentPrice))}</span>
          </p>
          {price.status === 'error' && (
            <p className="text-[12px] text-error">live price unavailable — using start price</p>
          )}
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <form onSubmit={handleManualPriceSubmit} className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={manualPriceDraft}
                onChange={(e) => setManualPriceDraft(e.target.value)}
                placeholder="Manual price"
                className="w-24 bg-bg-primary/50 border border-border rounded px-2 py-1 text-[12px] text-text-primary focus:border-accent focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-bg-primary/50 border border-border rounded text-[12px] text-text-primary hover:text-accent transition-colors"
              >
                Set
              </button>
            </form>
            {isOverridden && (
              <button
                type="button"
                onClick={() => price.clearManual()}
                className="text-[12px] text-text-secondary hover:text-accent underline decoration-dotted"
              >
                Clear override
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => price.refresh(true)} aria-label="Refresh price" className="p-1.5 text-text-secondary hover:text-accent">
            <RefreshCw className={`w-4 h-4 ${price.status === 'loading' ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => removePosition(analysisId, position.id)} aria-label="Delete position" className="p-1.5 text-text-secondary hover:text-error">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[13px]">
        <div><p className="text-text-secondary">Planned</p><p className="text-text-primary font-medium">{formatMoney(position.plannedAmount)}</p></div>
        <div><p className="text-text-secondary">Invested</p><p className="text-text-primary font-medium">{formatMoney(invested)} <span className="text-text-secondary">({formatMoney(variance(position.plannedAmount, position.lots))} vs plan)</span></p></div>
        <div><p className="text-text-secondary">Value now / P&L</p><p className="text-text-primary font-medium">{formatMoney(value)} · {pct(plPct(position.lots, currentPrice))} ({formatMoney(plDollars(position.lots, currentPrice))})</p></div>
        <div><p className="text-text-secondary">If fully executed</p><p className="text-text-primary font-medium">{formatMoney(counterfactual)}</p></div>
        <div><p className="text-text-secondary">Avg cost</p><p className="text-text-primary font-medium">{avgCostBasis(position.lots)?.toFixed(2) ?? '—'}</p></div>
        <div><p className="text-text-secondary">Allocation at start</p><p className="text-text-primary font-medium">{pct(allocationPct(position.plannedAmount, totals.plannedAll))}</p></div>
        <div><p className="text-text-secondary">Allocation now</p><p className="text-text-primary font-medium">{pct(allocationPct(value, totals.currentAll))}</p></div>
        <div><p className="text-text-secondary">Acted</p><p className="text-text-primary font-medium">
          <button onClick={() => updatePosition(analysisId, position.id, { acted: !position.acted })} className="underline decoration-dotted hover:text-accent">
            {position.acted ? 'Yes' : 'No — still watching'}
          </button>
        </p></div>
      </div>

      <details className="text-[13px]">
        <summary className="cursor-pointer text-text-secondary hover:text-accent">
          Buy lots ({position.lots.length})
        </summary>
        <div className="flex flex-col gap-2 mt-2">
          {position.lots.map((l) => (
            <div key={l.id} className="flex items-center justify-between border-b border-border pb-1">
              <span className="text-text-secondary">{l.date} — {formatMoney(l.amountInvested)} @ {l.price.toFixed(2)}</span>
              <button onClick={() => removeLot(analysisId, position.id, l.id)} aria-label="Remove lot" className="text-text-secondary hover:text-error">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-2">
            <ThemedDatePicker className="w-auto" value={lotDate} onChange={setLotDate} />
            <input type="number" className="bg-bg-primary/50 border border-border rounded px-2 py-1 text-text-primary w-28" value={lotAmount} onChange={(e) => setLotAmount(Number(e.target.value))} placeholder="Amount $" />
            <input type="number" step={0.01} className="bg-bg-primary/50 border border-border rounded px-2 py-1 text-text-primary w-24" value={lotPrice} onChange={(e) => setLotPrice(Number(e.target.value))} placeholder="Price" />
            <button
              onClick={() => lotAmount > 0 && lotPrice > 0 && addLot(analysisId, position.id, { id: `lot-${Date.now()}`, date: lotDate, amountInvested: lotAmount, price: lotPrice })}
              className="flex items-center gap-1 text-text-secondary hover:text-accent"
            >
              <Plus className="w-4 h-4" /> Add lot
            </button>
          </div>
        </div>
      </details>
    </div>
  )
}
