import React, { useEffect } from 'react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import {
  effectiveRate,
  FEDERAL_BRACKETS,
  marginalRate,
  marginalRateBreakdown,
  PROVINCES,
  PROVINCIAL_TAX,
  takeHomeWithDeductions,
  totalIncomeTax,
  type Bracket,
  type Province,
} from '../../utils/finance/canadaTax'
import { CalculatorField } from './CalculatorField'
import { SelectField } from './SelectField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

const TOOL_ID = 'salary-tax'
const DEFAULTS = { income: 100000, province: 'ON' as string, rrsp: 0, fhsa: 0 }

/** Bracket visual: one visually separate segment per bracket, with a rate
 *  label, income-range caption, and accent fill for the portion of income
 *  inside that bracket. */
export const BracketBar: React.FC<{ title: string; brackets: Bracket[]; income: number }> = ({ title, brackets, income }) => {
  const cap = Math.max(income * 1.25, 1)
  const segments = brackets
    .reduce<Array<{ start: number; end: number; rate: number }>>((acc, b) => {
      const start = acc.length > 0 ? acc[acc.length - 1].end : 0
      const end = Math.min(b.upTo, cap)
      if (end > start) acc.push({ start, end, rate: b.rate })
      return acc
    }, [])
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] uppercase tracking-wide text-text-secondary">{title}</span>
      <div className="w-full overflow-x-auto">
        <div className="flex w-full gap-1 min-w-full">
          {segments.map((s) => {
            const width = ((s.end - s.start) / cap) * 100
            const filledTo = Math.min(Math.max(income - s.start, 0), s.end - s.start)
            const filledPct = (s.end - s.start > 0 ? filledTo / (s.end - s.start) : 0) * 100
            const active = income > s.start
            return (
              <div key={s.start} className="flex flex-col gap-1 shrink-0" style={{ width: `${width}%`, minWidth: '3.5rem' }}>
                <div className={`@container relative h-7 rounded-md overflow-hidden border ${active ? 'border-accent/60' : 'border-border'} bg-bg-primary/40`}
                     title={`${(s.rate * 100).toFixed(2)}% on ${formatMoney(s.start)} to ${formatMoney(s.end)}`}>
                  <div className="absolute inset-y-0 left-0 bg-accent/60" style={{ width: `${filledPct}%` }} />
                  <span className="absolute inset-0 hidden @min-[44px]:flex items-center justify-center text-[11px] font-medium text-text-primary">
                    {(s.rate * 100).toFixed(1)}%
                  </span>
                </div>
                <span className="text-[10px] text-text-secondary text-center whitespace-nowrap">
                  {formatMoney(s.start)}{s.end < cap ? ` to ${formatMoney(s.end)}` : '+'}
                </span>
              </div>
            )
          })}
        </div>
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

  const t = takeHomeWithDeductions(income, province, inputs.rrsp, inputs.fhsa)
  const breakdown = marginalRateBreakdown(t.taxableIncome, province)
  const deductions = [
    { label: 'Federal Tax', value: t.federal },
    { label: 'Provincial Tax', value: t.provincial },
    { label: 'CPP (incl. CPP2)', value: t.cpp },
    { label: 'EI', value: t.ei },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <CalculatorField label="Gross Annual Income" prefix="$" step={1000} value={income} onChange={(v) => setInput(TOOL_ID, 'income', v)} />
        <SelectField
          label="Province"
          value={province}
          onChange={(v) => setInput(TOOL_ID, 'province', v)}
          options={PROVINCES.map((p) => ({ value: p.code, label: p.name }))}
        />
        <CalculatorField label="RRSP Contribution" prefix="$" step={500} value={inputs.rrsp} onChange={(v) => setInput(TOOL_ID, 'rrsp', v)} />
        <CalculatorField label="FHSA Contribution" prefix="$" step={500} value={inputs.fhsa} onChange={(v) => setInput(TOOL_ID, 'fhsa', v)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label="Total Income Tax" value={formatMoney(totalIncomeTax(t.taxableIncome, province))} highlight />
        <ResultCard label="Marginal Rate" value={`${marginalRate(t.taxableIncome, province).toFixed(2)}%`} />
        <ResultCard label="Effective Rate" value={`${effectiveRate(t.taxableIncome, province).toFixed(2)}%`} />
      </div>

      {inputs.rrsp + inputs.fhsa > 0 && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard label="Taxable Income" value={formatMoney(t.taxableIncome)} />
            <ResultCard label="Tax Savings From Contributions" value={formatMoney(t.taxSavings)} highlight />
            <ResultCard label="Net After Contributions" value={formatMoney(t.net - inputs.rrsp - inputs.fhsa)} />
          </div>
          <p className="text-[12px] text-text-secondary">
            RRSP limit is 18% of last year's earned income up to the annual maximum. FHSA limit is
            $8,000 per year. Contributions here are assumed fully deductible this year.
          </p>
        </div>
      )}

      <div className="themed-card rounded-lg p-4 flex flex-col gap-4">
        <BracketBar title="Federal Brackets" brackets={FEDERAL_BRACKETS} income={t.taxableIncome} />
        <BracketBar title={`${PROVINCIAL_TAX[province].name} Brackets`} brackets={PROVINCIAL_TAX[province].brackets} income={t.taxableIncome} />
        <div className="flex flex-col gap-1">
          <span className="text-[12px] uppercase tracking-wide text-text-secondary">Marginal Rate Breakdown</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-primary">
            <span>Federal {breakdown.federal.toFixed(2)}%</span>
            <span>+ Provincial {breakdown.provincialBase.toFixed(2)}%</span>
            {breakdown.surtax > 0 && <span>+ ON surtax {breakdown.surtax.toFixed(2)}%</span>}
            <span className="font-semibold">= {breakdown.total.toFixed(2)}%</span>
          </div>
        </div>
        <p className="text-[12px] text-text-secondary">
          Filled portion = income inside each bracket. The breakdown above shows why the marginal
          rate can exceed the bracket rates: Ontario's surtax adds to every extra dollar's tax.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label="Net Annual" value={formatMoney(t.net)} highlight />
        <ResultCard label="Net Monthly" value={formatMoney(t.net / 12)} />
        <ResultCard label="Net Biweekly" value={formatMoney(t.net / 26)} />
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
          2026 rates, employee side, basic personal amount only. An estimate, not payroll advice.
        </p>
      </div>
    </div>
  )
}
