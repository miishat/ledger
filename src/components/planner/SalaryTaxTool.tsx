import React, { useEffect } from 'react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import {
  FEDERAL_BRACKETS,
  marginalRateBreakdown,
  ontarioHealthPremium,
  salaryMarginalRate,
  PROVINCES,
  PROVINCIAL_TAX,
  takeHomeWithDeductions,
  type Bracket,
  type Province,
} from '../../utils/finance/canadaTax'
import { CalculatorField } from './CalculatorField'
import { SelectField } from './SelectField'
import { ResultCard } from './ResultCard'
import { formatMoney, formatMoneyCompact } from './format'
import { DeductionsBreakdown } from './DeductionsBreakdown'
import { RrspEfficiencyCard } from './RrspEfficiencyCard'
import { TaxYearNotice } from '../ui/TaxYearNotice'

const TOOL_ID = 'salary-tax'
const DEFAULTS = { income: 100000, province: 'ON' as string, rrsp: 0, fhsa: 0, rrspRoom: 0 }

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
      <div className="flex w-full gap-1">
        {segments.map((s) => {
          const width = ((s.end - s.start) / cap) * 100
          const filledTo = Math.min(Math.max(income - s.start, 0), s.end - s.start)
          const filledPct = (s.end - s.start > 0 ? filledTo / (s.end - s.start) : 0) * 100
          const active = income > s.start
          return (
            <div key={s.start} className="@container flex flex-col gap-1 min-w-0 overflow-hidden" style={{ flex: `${width} 1 0%` }}>
              <div className={`@container relative h-7 rounded-md overflow-hidden border ${active ? 'border-accent/60' : 'border-border'} bg-bg-primary/40`}
                   title={`${(s.rate * 100).toFixed(2)}% on ${formatMoney(s.start)} to ${formatMoney(s.end)}`}>
                {/* /45 not /60: the rate label sits on top of this fill, and at
                    60% the composite was 4.27:1 against the label in aurora and
                    4.19:1 in glass, both under AA. Lowering the accent share
                    moves the fill toward the page background, which raises
                    contrast in dark and light themes alike. */}
                {/* Fill and track are necessarily close in tone once the fill is
                    light enough for the label on top of it to read, so the
                    filled/unfilled boundary cannot rely on colour alone: WCAG
                    1.4.11 asks 3:1 for a graphical object against its
                    surroundings, and the two tones alone fall well short of
                    that in every theme. A full-strength accent edge is the
                    non-colour channel that keeps the boundary legible. Only
                    render it once there is a fill to bound, or an empty
                    bracket grows a stray line at its own left edge. */}
                <div
                  className={`absolute inset-y-0 left-0 bg-accent/45 ${filledPct > 0 ? 'border-r-2 border-accent' : ''}`}
                  style={{ width: `${filledPct}%` }}
                />
                <span className="absolute inset-0 hidden @min-[44px]:flex items-center justify-center text-meta font-medium text-text-primary">
                  {(s.rate * 100).toFixed(1)}%
                </span>
              </div>
              <span className="hidden text-micro text-text-secondary text-center whitespace-nowrap @min-[88px]:block @min-[120px]:hidden">
                {formatMoneyCompact(s.start)}{s.end < cap ? ` to ${formatMoneyCompact(s.end)}` : '+'}
              </span>
              <span className="hidden text-micro text-text-secondary text-center whitespace-nowrap @min-[120px]:block">
                {formatMoney(s.start)}{s.end < cap ? ` to ${formatMoney(s.end)}` : '+'}
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

  const enteredRoom = inputs.rrspRoom > 0 ? inputs.rrspRoom : null
  const deductibleRrsp = enteredRoom === null ? inputs.rrsp : Math.min(inputs.rrsp, enteredRoom)
  const t = takeHomeWithDeductions(income, province, deductibleRrsp, inputs.fhsa)
  const breakdown = marginalRateBreakdown(income, province, deductibleRrsp, inputs.fhsa)
  const adjustmentPercent = Math.abs(breakdown.adjustments).toFixed(2)
  const incomeTax = t.federal + t.provincial
  const room = enteredRoom === null ? null : Math.max(0, enteredRoom - inputs.rrsp)
  const annualOntarioPremium = province === 'ON' ? ontarioHealthPremium(t.provincialTaxableIncome) : 0
  const annualOntarioReduction = province === 'ON' ? Math.max(0, annualOntarioPremium - t.provincialAdjustments) : 0
  const annualReductionLabel = province === 'BC' ? 'Annual BC tax reduction'
    : province === 'AB' ? 'Annual Alberta supplemental credit' : null

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <CalculatorField label="Gross Annual Income" prefix="$" step={1000} value={income} onChange={(v) => setInput(TOOL_ID, 'income', v)} />
        <SelectField
          label="Province"
          value={province}
          onChange={(v) => setInput(TOOL_ID, 'province', v)}
          options={PROVINCES.map((p) => ({ value: p.code, label: p.name }))}
        />
        <CalculatorField label="RRSP Contribution" prefix="$" step={500} value={inputs.rrsp} onChange={(v) => setInput(TOOL_ID, 'rrsp', v)} />
        <CalculatorField label="FHSA Contribution" prefix="$" step={500} value={inputs.fhsa} onChange={(v) => setInput(TOOL_ID, 'fhsa', v)} />
        <CalculatorField label="CRA RRSP Deduction Limit" prefix="$" step={500} value={inputs.rrspRoom} onChange={(v) => setInput(TOOL_ID, 'rrspRoom', v)} />
      </div>
      <p className="text-[12px] text-text-secondary">
        CRA RRSP Deduction Limit is optional. Leave it at $0 if unknown; $0 is not
        treated as a verified limit, and no room is estimated from current salary.
      </p>

      <TaxYearNotice showYearLabel />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label="Total Income Tax" value={formatMoney(incomeTax)} highlight />
        <ResultCard label="Marginal Rate" value={`${salaryMarginalRate(income, province, deductibleRrsp, inputs.fhsa).toFixed(2)}%`} />
        <ResultCard label="Effective Rate" value={`${(income > 0 ? incomeTax / income * 100 : 0).toFixed(2)}%`} />
      </div>

      {inputs.rrsp + inputs.fhsa > 0 && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard label="Taxable Income" value={formatMoney(t.taxableIncome)} />
            <ResultCard label="Tax Savings From Contributions" value={formatMoney(t.taxSavings)} highlight />
            <ResultCard label="Net After Contributions" value={formatMoney(t.net - inputs.rrsp - inputs.fhsa)} />
          </div>
          <p className="text-[12px] text-text-secondary">
            Enter your 2026 RRSP deduction limit from your CRA notice of assessment if known.
            Leave the limit at $0 if unknown; no room is estimated. Without a limit,
            tax savings assume your entered RRSP contribution is deductible. With a limit,
            only the amount within it is treated as deductible. FHSA contributions are
            assumed deductible within the applicable rules.
          </p>
          {enteredRoom !== null && inputs.rrsp > enteredRoom && (
            <p className="text-[12px] text-text-secondary" role="status">
              Your RRSP contribution exceeds the CRA limit entered by {formatMoney(inputs.rrsp - enteredRoom)}.
              The excess is included in your cash outflow but receives no current-year tax deduction here.
            </p>
          )}
        </div>
      )}

      <div className="themed-card rounded-lg p-4 flex flex-col gap-4">
        <BracketBar title="Federal Brackets" brackets={FEDERAL_BRACKETS} income={t.taxableIncome} />
        <BracketBar title={`${PROVINCIAL_TAX[province].name} Brackets`} brackets={PROVINCIAL_TAX[province].brackets} income={t.provincialTaxableIncome} />
        <div className="flex flex-col gap-1">
          <span className="text-[12px] uppercase tracking-wide text-text-secondary">Marginal Rate Breakdown</span>
          <div className="text-[13px] leading-relaxed text-text-primary">
            <span className="whitespace-nowrap">Federal {breakdown.federal.toFixed(2)}%</span>{' '}
            <span className="whitespace-nowrap">+ Provincial {breakdown.provincialBase.toFixed(2)}%</span>
            {breakdown.surtax > 0 && <>{' '}<span className="whitespace-nowrap">+ ON surtax {breakdown.surtax.toFixed(2)}%</span></>}
            {adjustmentPercent !== '0.00' && <>{' '}<span className="whitespace-nowrap">{breakdown.adjustments < 0 ? '−' : '+'} Provincial adjustments {adjustmentPercent}%</span></>}
            {' '}<span className="font-semibold whitespace-nowrap">= {breakdown.total.toFixed(2)}%</span>
          </div>
          {(annualOntarioPremium > 0 || annualOntarioReduction > 0 || (annualReductionLabel && t.provincialAdjustments < 0)) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-text-secondary">
              <span>Included in annual Provincial Tax:</span>
              {annualOntarioPremium > 0 && <span>Annual Ontario Health Premium <strong className="font-medium text-text-primary">{formatMoney(annualOntarioPremium)}</strong></span>}
              {annualOntarioReduction > 0 && <span>Ontario tax reduction <strong className="font-medium text-text-primary">{formatMoney(-annualOntarioReduction)}</strong></span>}
              {annualReductionLabel && t.provincialAdjustments < 0 && <span>{annualReductionLabel} <strong className="font-medium text-text-primary">{formatMoney(t.provincialAdjustments)}</strong></span>}
            </div>
          )}
        </div>
        <p className="text-[12px] text-text-secondary">
          Filled portion = income inside each bracket. Federal brackets use {formatMoney(t.taxableIncome)}
          {' '}taxable income after deductions{province === 'QC' ? `; Quebec brackets use ${formatMoney(t.provincialTaxableIncome)}` : ''}.
          {' '}Marginal percentages also reflect changes in pension deductions and tax credits, so they can differ from bracket rates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label="Net Annual" value={formatMoney(t.net)} highlight />
        <ResultCard label="Net Monthly" value={formatMoney(t.net / 12)} />
        <ResultCard label="Net Biweekly" value={formatMoney(t.net / 26)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4">
        <DeductionsBreakdown t={t} />
        <RrspEfficiencyCard
          gross={income}
          taxableIncome={t.taxableIncome}
          rrsp={deductibleRrsp}
          fhsa={inputs.fhsa}
          province={province}
          room={room}
        />
      </div>
    </div>
  )
}
