import React from 'react'
import { ArrowLeftRight, RefreshCw } from 'lucide-react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import { fxKey, todayKey, useFxRate, type Currency } from '../../services/marketData'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { CalculatorField } from './CalculatorField'
import { ResultCard } from './ResultCard'

const TOOL_ID = 'currency-converter'
const DEFAULTS = { amount: 100, from: 'USD' as string, date: '' as string }

function formatAmount(n: number, currency: string): string {
  return `${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

export const CurrencyConverter: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)

  const from = inputs.from as Currency
  const to: Currency = from === 'USD' ? 'CAD' : 'USD'
  const date = inputs.date || undefined // optional historical lookup
  const fx = useFxRate(from, to, date)

  const overrideKey = fxKey(from, to, date ?? todayKey())
  const override = useMarketDataStore((s) => s.overrides[overrideKey])
  const setOverride = useMarketDataStore((s) => s.setOverride)
  const clearOverride = useMarketDataStore((s) => s.clearOverride)

  const rate = override ?? fx.data?.value.rate
  const converted = rate !== undefined ? inputs.amount * rate : undefined

  const sourceLabel =
    override !== undefined
      ? 'manual override'
      : fx.data
        ? `${fx.data.source}${fx.data.stale ? ' (stale)' : ''} — as of ${new Date(fx.data.asOf).toLocaleString()}`
        : fx.status

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <CalculatorField label={`Amount (${from})`} step={10} value={inputs.amount} onChange={(v) => setInput(TOOL_ID, 'amount', v)} />
        <button
          onClick={() => setInput(TOOL_ID, 'from', to)}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-text-secondary hover:text-accent hover:border-accent transition-colors"
          aria-label="Swap currencies"
        >
          <ArrowLeftRight className="w-4 h-4" /> {from} → {to}
        </button>
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-medium text-text-secondary">Rate date (optional)</span>
          <input
            type="date"
            className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[15px] outline-none focus:border-accent"
            value={inputs.date as string}
            onChange={(e) => setInput(TOOL_ID, 'date', e.target.value)}
          />
        </label>
        <button
          onClick={() => fx.refresh()}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-text-secondary hover:text-accent hover:border-accent transition-colors"
          aria-label="Refresh rate"
        >
          <RefreshCw className={`w-4 h-4 ${fx.status === 'loading' ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResultCard
          label={`Converted (${to})`}
          value={converted !== undefined ? formatAmount(converted, to) : fx.status === 'error' ? 'Unavailable — set a manual rate' : '…'}
          highlight
        />
        <ResultCard label={`Rate ${from}→${to}`} value={rate !== undefined ? rate.toFixed(4) : '…'} />
      </div>

      <div className="themed-card rounded-lg p-4 flex flex-col gap-3">
        <p className="text-[12px] uppercase tracking-wide text-text-secondary">Rate source: {sourceLabel}</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-medium text-text-secondary">Manual rate override</span>
            <input
              type="number"
              step={0.0001}
              className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[15px] outline-none focus:border-accent w-40"
              value={override ?? ''}
              placeholder={fx.data?.value.rate.toFixed(4) ?? ''}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (e.target.value !== '' && Number.isFinite(v) && v > 0) setOverride(overrideKey, v)
              }}
            />
          </label>
          {override !== undefined && (
            <button
              onClick={() => clearOverride(overrideKey)}
              className="px-3 py-2 rounded-lg border border-border text-[13px] text-text-secondary hover:text-accent hover:border-accent transition-colors"
            >
              Clear override — use live
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
