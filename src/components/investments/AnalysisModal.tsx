import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useHistoricalPrice } from '../../services/marketData'
import { useAnalysisStore } from '../../store/useAnalysisStore'

interface AnalysisModalProps {
  isOpen: boolean
  onClose: () => void
}

const inputCls =
  'bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[15px] outline-none focus:border-accent w-full'

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose }) => {
  const addAnalysis = useAnalysisStore((s) => s.addAnalysis)
  const [ticker, setTicker] = useState('')
  const [exchange, setExchange] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [plannedAmount, setPlannedAmount] = useState(10000)
  const [thesis, setThesis] = useState('')
  const [manualPrice, setManualPrice] = useState<number | null>(null)

  const hist = useHistoricalPrice(ticker, exchange || undefined, date)
  const fetchedPrice = hist.data?.value.close
  const effectivePrice = manualPrice ?? fetchedPrice ?? 0

  if (!isOpen) return null

  const canSave = ticker.trim() !== '' && plannedAmount > 0 && date !== '' && effectivePrice > 0

  const save = () => {
    addAnalysis({
      id: `an-${Date.now()}`,
      ticker: ticker.trim().toUpperCase(),
      exchange: exchange.trim() || undefined,
      thesis: thesis.trim() || undefined,
      plannedAmount,
      analysisDate: date,
      startPrice: effectivePrice,
      startPriceSource: manualPrice !== null ? 'manual' : 'auto',
      acted: false,
      lots: [],
    })
    setTicker(''); setExchange(''); setThesis(''); setManualPrice(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="themed-card rounded-lg p-6 w-full max-w-lg flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-text-primary">New analysis</h2>
          <button onClick={onClose} aria-label="Close" className="text-text-secondary hover:text-accent">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-text-secondary">Ticker</span>
            <input className={inputCls} value={ticker} onChange={(e) => { setTicker(e.target.value); setManualPrice(null) }} placeholder="AAPL" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-text-secondary">Exchange (optional)</span>
            <input className={inputCls} value={exchange} onChange={(e) => setExchange(e.target.value)} placeholder="TSX" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-text-secondary">Analysis date</span>
            <input type="date" className={inputCls} value={date} onChange={(e) => { setDate(e.target.value); setManualPrice(null) }} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-text-secondary">Planned amount ($)</span>
            <input type="number" className={inputCls} value={plannedAmount} onChange={(e) => setPlannedAmount(Number(e.target.value))} />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-text-secondary">
            Start price {manualPrice !== null
              ? '(manual)'
              : fetchedPrice !== undefined
                ? `(auto — ${hist.data?.source}${hist.data?.stale ? ', stale' : ''})`
                : hist.status === 'loading'
                  ? '(fetching…)'
                  : '(enter manually or pick ticker + date)'}
          </span>
          <div className="flex gap-2">
            <input
              type="number"
              step={0.01}
              className={inputCls}
              value={effectivePrice || ''}
              onChange={(e) => setManualPrice(Number(e.target.value))}
            />
            {manualPrice !== null && fetchedPrice !== undefined && (
              <button onClick={() => setManualPrice(null)} className="text-[12px] text-text-secondary hover:text-accent whitespace-nowrap">
                Use fetched ({fetchedPrice.toFixed(2)})
              </button>
            )}
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-text-secondary">Thesis (optional)</span>
          <textarea className={`${inputCls} min-h-[70px]`} value={thesis} onChange={(e) => setThesis(e.target.value)} placeholder="Why this investment?" />
        </label>

        <button
          onClick={save}
          disabled={!canSave}
          className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Save analysis
        </button>
      </div>
    </div>
  )
}
