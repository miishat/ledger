import React, { useEffect } from 'react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import {
  effectiveRate,
  FEDERAL_BRACKETS,
  marginalRate,
  marginalRateBreakdown,
  PROVINCES,
  PROVINCIAL_TAX,
  takeHomePay,
  totalIncomeTax,
  type Bracket,
  type Province,
} from '../../utils/finance/canadaTax'
import { CalculatorField } from './CalculatorField'
import { SelectField } from './SelectField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

const TOOL_ID = 'salary-tax'
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

export const SalaryTaxTool: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const province = inputs.province as Province
  const income = inputs.income

  // One-time seed from the legacy income-tax / take-home-pay saved inputs so
  // nobody loses their numbers. Legacy entries are read, never deleted.
  useEffect(() => {
    const { inputs: all, setInput: set } = usePlannerStore.getState()
    if (all[TOOL_ID] !== undefined) return
    const oldTax = all['income-tax']
    const oldPay = all['take-home-pay']
    if (oldTax) {
      if (typeof oldTax.income === 'number') set(TOOL_ID, 'income', oldTax.income)
      if (typeof oldTax.province === 'string') set(TOOL_ID, 'province', oldTax.province)
    } else if (oldPay) {
      if (typeof oldPay.gross === 'number') set(TOOL_ID, 'income', oldPay.gross)
      if (typeof oldPay.province === 'string') set(TOOL_ID, 'province', oldPay.province)
    }
  }, [])

  const breakdown = marginalRateBreakdown(income, province)
  const t = takeHomePay(income, province)
  const deductions = [
    { label: 'Federal tax', value: t.federal },
    { label: 'Provincial tax', value: t.provincial },
    { label: 'CPP (incl. CPP2)', value: t.cpp },
    { label: 'EI', value: t.ei },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <CalculatorField label="Gross annual income" prefix="$" step={1000} value={income} onChange={(v) => setInput(TOOL_ID, 'income', v)} />
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
        <div className="flex flex-col gap-1">
          <span className="text-[12px] uppercase tracking-wide text-text-secondary">Marginal rate breakdown</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-primary">
            <span>Federal {breakdown.federal.toFixed(2)}%</span>
            <span>+ Provincial {breakdown.provincialBase.toFixed(2)}%</span>
            {breakdown.surtax > 0 && <span>+ ON surtax {breakdown.surtax.toFixed(2)}%</span>}
            <span className="font-semibold">= {breakdown.total.toFixed(2)}%</span>
          </div>
        </div>
        <p className="text-[12px] text-text-secondary">
          Filled portion = income inside each bracket. The breakdown above shows why the marginal
          rate can exceed the bracket rates — Ontario's surtax adds to every extra dollar's tax.
        </p>
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
