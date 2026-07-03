import React from 'react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import { PROVINCES, takeHomePay, type Province } from '../../utils/finance/canadaTax'
import { CalculatorField } from './CalculatorField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

const TOOL_ID = 'take-home-pay'
const DEFAULTS = { gross: 100000, province: 'ON' as string }

export const TakeHomePayCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const province = inputs.province as Province
  const t = takeHomePay(inputs.gross, province)

  const deductions = [
    { label: 'Federal tax', value: t.federal },
    { label: 'Provincial tax', value: t.provincial },
    { label: 'CPP (incl. CPP2)', value: t.cpp },
    { label: 'EI', value: t.ei },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CalculatorField label="Gross annual salary" prefix="$" step={1000} value={inputs.gross} onChange={(v) => setInput(TOOL_ID, 'gross', v)} />
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-medium text-text-secondary">Province</span>
          <select
            className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[15px] outline-none focus:border-accent"
            value={province}
            onChange={(e) => setInput(TOOL_ID, 'province', e.target.value)}
          >
            {PROVINCES.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label="Net annual" value={formatMoney(t.net)} highlight />
        <ResultCard label="Net monthly" value={formatMoney(t.net / 12)} />
        <ResultCard label="Net biweekly" value={formatMoney(t.net / 26)} />
      </div>

      <div className="themed-card rounded-lg p-4 flex flex-col gap-2">
        <p className="text-[12px] uppercase tracking-wide text-text-secondary">Deductions</p>
        {deductions.map((d) => (
          <div key={d.label} className="flex items-center gap-3">
            <span className="text-[13px] text-text-secondary w-40 shrink-0">{d.label}</span>
            <div className="flex-1 h-2 rounded bg-bg-primary/50 overflow-hidden">
              <div className="h-full bg-accent/70" style={{ width: `${t.gross > 0 ? (d.value / t.gross) * 100 : 0}%` }} />
            </div>
            <span className="text-[13px] text-text-primary w-24 text-right">{formatMoney(d.value)}</span>
          </div>
        ))}
        <p className="text-[12px] text-text-secondary mt-2">
          2026 rates, employee side, basic personal amount only — an estimate, not payroll advice.
        </p>
      </div>
    </div>
  )
}
