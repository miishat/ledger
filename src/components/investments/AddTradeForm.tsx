import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAnalysisStore, type InvestmentAnalysis } from '../../store/useAnalysisStore'
import { ThemedSelect } from '../ui/ThemedSelect'
import { ThemedDatePicker } from '../ui/ThemedDatePicker'

const inputCls =
  'bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[14px] outline-none focus:border-accent w-28'

/** "Add Trade" entry point for the Actual tab: pick a planned ticker,
 *  enter date / shares / price; saved as a buy lot on that position. */
export const AddTradeForm: React.FC<{ analysis: InvestmentAnalysis }> = ({ analysis }) => {
  const addLot = useAnalysisStore((s) => s.addLot)
  const [open, setOpen] = useState(false)
  const [positionId, setPositionId] = useState(analysis.positions[0]?.id ?? '')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [shares, setShares] = useState(0)
  const [price, setPrice] = useState(0)

  if (analysis.positions.length === 0) return null

  const save = () => {
    if (!positionId || shares <= 0 || price <= 0) return
    addLot(analysis.id, positionId, {
      id: `lot-${Date.now()}`,
      date,
      amountInvested: shares * price,
      price,
    })
    setShares(0)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-accent text-accent bg-accent/10 hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" /> Add Trade
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-2 border border-border rounded-lg p-3">
      <label className="flex flex-col gap-1">
        <span className="text-[12px] text-text-secondary">Ticker</span>
        <ThemedSelect
          value={positionId}
          onChange={setPositionId}
          options={analysis.positions.map((p) => ({ value: p.id, label: p.ticker }))}
          className="w-32"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[12px] text-text-secondary">Date</span>
        <ThemedDatePicker value={date} onChange={setDate} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[12px] text-text-secondary">Shares</span>
        <input aria-label="Shares" type="number" step={0.01} className={inputCls} value={shares || ''} onChange={(e) => setShares(Number(e.target.value))} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[12px] text-text-secondary">Price</span>
        <input aria-label="Price" type="number" step={0.01} className={inputCls} value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} />
      </label>
      <button
        type="button"
        onClick={save}
        disabled={shares <= 0 || price <= 0}
        className="px-3 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[13px] font-medium disabled:opacity-40"
      >
        Save Trade
      </button>
      <button type="button" onClick={() => setOpen(false)} className="px-2 py-2 text-[13px] text-text-secondary hover:text-text-primary">
        Cancel
      </button>
    </div>
  )
}
