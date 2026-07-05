import React from 'react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import {
  solveAnnualRate,
  solveMonthlyContribution,
  solveMonths,
  solveTarget,
} from '../../utils/finance/savingsGoal'
import { CalculatorField } from './CalculatorField'
import { SelectField } from './SelectField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

const TOOL_ID = 'savings-goal'
type SolveFor = 'target' | 'monthly' | 'months' | 'rate'
const DEFAULTS = {
  solveFor: 'monthly' as string,
  target: 100000,
  principal: 10000,
  monthlyContribution: 500,
  annualRatePct: 5,
  years: 10,
}

function formatMonths(m: number): string {
  return `${Math.floor(m / 12)}y ${m % 12}m`
}

export const SavingsGoalCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const set = (field: string) => (v: number) => setInput(TOOL_ID, field, v)
  const solveFor = inputs.solveFor as SolveFor

  const months = Math.max(1, Math.round(inputs.years * 12))
  let result: { label: string; value: string }
  switch (solveFor) {
    case 'target': {
      const v = solveTarget(inputs.principal, inputs.annualRatePct, inputs.monthlyContribution, months)
      result = { label: 'Projected balance', value: formatMoney(v) }
      break
    }
    case 'months': {
      const m = solveMonths(inputs.target, inputs.principal, inputs.annualRatePct, inputs.monthlyContribution)
      result = { label: 'Time to goal', value: m === null ? 'Not reachable' : formatMonths(m) }
      break
    }
    case 'rate': {
      const r = solveAnnualRate(inputs.target, inputs.principal, inputs.monthlyContribution, months)
      result = { label: 'Annual return needed', value: r === null ? 'Not reachable' : `${r.toFixed(2)}%` }
      break
    }
    default: {
      const c = solveMonthlyContribution(inputs.target, inputs.principal, inputs.annualRatePct, months)
      result = { label: 'Monthly contribution needed', value: c === null ? 'Not reachable' : formatMoney(c) }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-xs">
        <SelectField label="Solve for" value={solveFor} onChange={(v) => setInput(TOOL_ID, 'solveFor', v)}>
          <option value="monthly">Monthly contribution</option>
          <option value="months">Time to goal</option>
          <option value="rate">Required return</option>
          <option value="target">Final balance</option>
        </SelectField>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
        {solveFor !== 'target' && (
          <CalculatorField label="Goal amount" prefix="$" step={1000} value={inputs.target} onChange={set('target')} />
        )}
        <CalculatorField label="Starting amount" prefix="$" step={100} value={inputs.principal} onChange={set('principal')} />
        {solveFor !== 'monthly' && (
          <CalculatorField label="Monthly contribution" prefix="$" step={50} value={inputs.monthlyContribution} onChange={set('monthlyContribution')} />
        )}
        {solveFor !== 'rate' && (
          <CalculatorField label="Annual return" suffix="%" step={0.1} value={inputs.annualRatePct} onChange={set('annualRatePct')} />
        )}
        {solveFor !== 'months' && (
          <CalculatorField label="Years" min={1} max={60} value={inputs.years} onChange={set('years')} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResultCard label={result.label} value={result.value} highlight />
      </div>
    </div>
  )
}
