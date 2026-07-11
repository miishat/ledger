import React from 'react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import { futureCost, presentValue, purchasingPowerChangePct } from '../../utils/finance/inflation'
import { CalculatorField } from './CalculatorField'
import { SelectField } from './SelectField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

const TOOL_ID = 'inflation-adjuster'
const DEFAULTS = {
  direction: 'future' as string, // 'future' = today's $ -> future cost; 'present' = future $ -> today's value
  amount: 10000,
  years: 10,
  inflationPct: 2.5,
}

export const InflationAdjusterCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const set = (field: string) => (v: number) => setInput(TOOL_ID, field, v)
  const toFuture = inputs.direction !== 'present'

  const converted = toFuture
    ? futureCost(inputs.amount, inputs.inflationPct, inputs.years)
    : presentValue(inputs.amount, inputs.inflationPct, inputs.years)
  const powerChange = purchasingPowerChangePct(inputs.inflationPct, inputs.years)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <SelectField
          label="Direction"
          value={inputs.direction as string}
          onChange={(v) => setInput(TOOL_ID, 'direction', v)}
          options={[
            { value: 'future', label: "Today's $ → Future Cost" },
            { value: 'present', label: "Future $ → Today's Value" },
          ]}
        />
        <CalculatorField label={toFuture ? 'Amount Today' : 'Future Amount'} prefix="$" step={100} value={inputs.amount} onChange={set('amount')} />
        <CalculatorField label="Years" min={0} max={80} value={inputs.years} onChange={set('years')} />
        <CalculatorField label="Annual Inflation" suffix="%" step={0.1} value={inputs.inflationPct} onChange={set('inflationPct')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResultCard
          label={toFuture ? `Cost in ${inputs.years} Years` : "Worth in Today's Dollars"}
          value={formatMoney(converted)}
          highlight
        />
        <ResultCard
          label={`Purchasing Power Change Over ${inputs.years} Years`}
          value={`${powerChange.toFixed(1)}%`}
        />
      </div>
    </div>
  )
}
