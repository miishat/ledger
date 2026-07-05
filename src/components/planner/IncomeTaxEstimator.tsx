import React from 'react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import {
  effectiveRate,
  FEDERAL_BRACKETS,
  marginalRate,
  PROVINCES,
  PROVINCIAL_TAX,
  totalIncomeTax,
  type Bracket,
  type Province,
} from '../../utils/finance/canadaTax'
import { CalculatorField } from './CalculatorField'
import { SelectField } from './SelectField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

const TOOL_ID = 'income-tax'
const DEFAULTS = { income: 100000, province: 'ON' as string }

/** Horizontal stacked bar: one segment per bracket, filled up to `income`. */
const BracketBar: React.FC<{ title: string; brackets: Bracket[]; income: number }> = ({ title, brackets, income }) => {
  const cap = Math.max(income * 1.25, 1) // view window slightly past current income
  const segments = brackets
    .reduce<Array<{ start: number; end: number; rate: number; lower: number }>>((acc, b) => {
      const lower = acc.length > 0 ? acc[acc.length - 1].lower : 0
      const start = lower
      const end = Math.min(b.upTo, cap)
      if (end > start) {
        acc.push({ start, end, rate: b.rate, lower: b.upTo })
      }
      return acc
    }, [])
    .map(({ start, end, rate }) => ({ start, end, rate }))
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] uppercase tracking-wide text-text-secondary">{title}</span>
      <div className="flex h-6 w-full rounded overflow-hidden border border-border">
        {segments.map((s) => {
          const width = ((s.end - s.start) / cap) * 100
          const filledTo = Math.min(Math.max(income - s.start, 0), s.end - s.start)
          const filledPct = ((s.end - s.start) > 0 ? filledTo / (s.end - s.start) : 0) * 100
          return (
            <div key={s.start} className="relative bg-bg-primary/40 border-r border-border last:border-r-0" style={{ width: `${width}%` }} title={`${(s.rate * 100).toFixed(2)}% from ${formatMoney(s.start)}`}>
              <div className="absolute inset-y-0 left-0 bg-accent/60" style={{ width: `${filledPct}%` }} />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-text-primary">
                {(s.rate * 100).toFixed(1)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const IncomeTaxEstimator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const province = inputs.province as Province
  const income = inputs.income

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <CalculatorField label="Taxable income" prefix="$" step={1000} value={income} onChange={(v) => setInput(TOOL_ID, 'income', v)} />
        <SelectField label="Province" value={province} onChange={(v) => setInput(TOOL_ID, 'province', v)}>
          {PROVINCES.map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label="Total income tax" value={formatMoney(totalIncomeTax(income, province))} highlight />
        <ResultCard label="Marginal rate" value={`${marginalRate(income, province).toFixed(2)}%`} />
        <ResultCard label="Effective rate" value={`${effectiveRate(income, province).toFixed(2)}%`} />
      </div>

      <div className="themed-card rounded-lg p-4 flex flex-col gap-4">
        <BracketBar title="Federal Brackets" brackets={FEDERAL_BRACKETS} income={income} />
        <BracketBar title={`${PROVINCIAL_TAX[province].name} Brackets`} brackets={PROVINCIAL_TAX[province].brackets} income={income} />
        <p className="text-[12px] text-text-secondary">
          Filled portion = income inside each bracket. Marginal rate shown includes the Ontario surtax where it applies.
        </p>
      </div>
    </div>
  )
}
