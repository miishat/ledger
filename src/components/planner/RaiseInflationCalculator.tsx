import React from 'react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import { nominalRaisePct, realRaisePct } from '../../utils/finance/raise'
import { CalculatorField } from './CalculatorField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

const TOOL_ID = 'raise-inflation'
const DEFAULTS = { oldSalary: 100000, newSalary: 105000, inflationPct: 3 }

export const RaiseInflationCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const set = (field: string) => (v: number) => setInput(TOOL_ID, field, v)

  const nominal = nominalRaisePct(inputs.oldSalary, inputs.newSalary)
  const real = realRaisePct(nominal, inputs.inflationPct)
  const realDollars = inputs.oldSalary * (real / 100)

  const verdict =
    real > 0.25
      ? `A real raise: your purchasing power grew ${real.toFixed(2)}%.`
      : real < -0.25
        ? `Not a real raise. Inflation ate it. You're down ${Math.abs(real).toFixed(2)}% in purchasing power.`
        : 'A wash: your raise roughly matches inflation.'

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <CalculatorField label="Old Salary" prefix="$" step={1000} value={inputs.oldSalary} onChange={set('oldSalary')} />
        <CalculatorField label="New Salary" prefix="$" step={1000} value={inputs.newSalary} onChange={set('newSalary')} />
        <CalculatorField label="Inflation" suffix="%" step={0.1} value={inputs.inflationPct} onChange={set('inflationPct')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label="Nominal Raise" value={`${nominal.toFixed(2)}%`} />
        <ResultCard label="Real Raise" value={`${real.toFixed(2)}%`} highlight />
        <ResultCard label="Real Change (Old-Salary Dollars)" value={formatMoney(realDollars)} />
      </div>

      <p className="text-[14px] text-text-primary">{verdict}</p>
    </div>
  )
}
