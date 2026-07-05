import React from 'react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import { marginalRate, PROVINCES, type Province } from '../../utils/finance/canadaTax'
import { compareRrspTfsa } from '../../utils/finance/rrspVsTfsa'
import { CalculatorField } from './CalculatorField'
import { SelectField } from './SelectField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

const TOOL_ID = 'rrsp-vs-tfsa'
const DEFAULTS = {
  amount: 10000,
  income: 100000,
  province: 'ON' as string,
  retireIncome: 55000,
  annualReturnPct: 6,
  years: 25,
}

export const RrspVsTfsaCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const set = (field: string) => (v: number) => setInput(TOOL_ID, field, v)
  const province = inputs.province as Province

  const nowRate = marginalRate(inputs.income, province)
  const retireRate = marginalRate(inputs.retireIncome, province)
  const r = compareRrspTfsa(inputs.amount, nowRate, retireRate, inputs.annualReturnPct, inputs.years)

  const verdict =
    r.recommendation === 'Either'
      ? 'At equal marginal rates RRSP and TFSA are equivalent, pick by flexibility.'
      : r.recommendation === 'RRSP'
        ? 'Your marginal rate today is higher than in retirement: the RRSP deduction wins.'
        : 'You expect a higher rate in retirement: pay the tax now and grow tax-free in the TFSA.'

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <CalculatorField label="Amount to invest (pre-tax)" prefix="$" step={500} value={inputs.amount} onChange={set('amount')} />
        <CalculatorField label="Current income" prefix="$" step={1000} value={inputs.income} onChange={set('income')} />
        <SelectField
          label="Province"
          value={province}
          onChange={(v) => setInput(TOOL_ID, 'province', v)}
          options={PROVINCES.map((p) => ({ value: p.code, label: p.name }))}
        />
        <CalculatorField label="Expected retirement income" prefix="$" step={1000} value={inputs.retireIncome} onChange={set('retireIncome')} />
        <CalculatorField label="Annual return" suffix="%" step={0.1} value={inputs.annualReturnPct} onChange={set('annualReturnPct')} />
        <CalculatorField label="Years invested" min={1} max={60} value={inputs.years} onChange={set('years')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label="Recommendation" value={r.recommendation} highlight />
        <ResultCard label={`RRSP after tax (${retireRate.toFixed(1)}% at withdrawal)`} value={formatMoney(r.rrspNet)} />
        <ResultCard label={`TFSA after tax (${nowRate.toFixed(1)}% today)`} value={formatMoney(r.tfsaNet)} />
      </div>

      <p className="text-[13px] text-text-secondary">{verdict} Marginal rates come from the 2026 tax tables for your province.</p>
    </div>
  )
}
