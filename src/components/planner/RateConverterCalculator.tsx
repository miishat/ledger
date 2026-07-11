import React from 'react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import { aprToApy, apyToApr, periodicRatePct, cagrPct, totalReturnPct } from '../../utils/finance/rates'
import { CalculatorField } from './CalculatorField'
import { SelectField } from './SelectField'
import { ResultCard } from './ResultCard'

const TOOL_ID = 'rate-converter'
const DEFAULTS = {
  mode: 'apr-apy' as string, // 'apr-apy' | 'cagr'
  direction: 'apr-to-apy' as string,
  ratePct: 6,
  periodsPerYear: 12,
  startValue: 10000,
  endValue: 14000,
  years: 3,
}

const FREQUENCIES = [
  { value: '1', label: 'Annually' },
  { value: '2', label: 'Semi-Annually' },
  { value: '4', label: 'Quarterly' },
  { value: '12', label: 'Monthly' },
  { value: '365', label: 'Daily' },
]

export const RateConverterCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const set = (field: string) => (v: number) => setInput(TOOL_ID, field, v)
  const isCagr = inputs.mode === 'cagr'
  const aprToApyDir = inputs.direction !== 'apy-to-apr'
  const n = Number(inputs.periodsPerYear) || 1

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <SelectField
          label="Mode"
          value={inputs.mode as string}
          onChange={(v) => setInput(TOOL_ID, 'mode', v)}
          options={[
            { value: 'apr-apy', label: 'APR ⇄ APY' },
            { value: 'cagr', label: 'Annualized Return (CAGR)' },
          ]}
        />
        {isCagr ? (
          <>
            <CalculatorField label="Starting Value" prefix="$" step={100} value={inputs.startValue} onChange={set('startValue')} />
            <CalculatorField label="Ending Value" prefix="$" step={100} value={inputs.endValue} onChange={set('endValue')} />
            <CalculatorField label="Years" min={0} max={80} step={0.5} value={inputs.years} onChange={set('years')} />
          </>
        ) : (
          <>
            <SelectField
              label="Direction"
              value={inputs.direction as string}
              onChange={(v) => setInput(TOOL_ID, 'direction', v)}
              options={[
                { value: 'apr-to-apy', label: 'APR → APY' },
                { value: 'apy-to-apr', label: 'APY → APR' },
              ]}
            />
            <CalculatorField label={aprToApyDir ? 'APR' : 'APY'} suffix="%" step={0.05} value={inputs.ratePct} onChange={set('ratePct')} />
            <SelectField
              label="Compounding"
              value={String(inputs.periodsPerYear)}
              onChange={(v) => setInput(TOOL_ID, 'periodsPerYear', Number(v))}
              options={FREQUENCIES}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isCagr ? (
          <>
            <ResultCard
              label="Annualized Return (CAGR)"
              value={(() => { const r = cagrPct(inputs.startValue, inputs.endValue, inputs.years); return r === null ? 'n/a' : `${r.toFixed(2)}%` })()}
              highlight
            />
            <ResultCard
              label="Total Return"
              value={(() => { const r = totalReturnPct(inputs.startValue, inputs.endValue); return r === null ? 'n/a' : `${r.toFixed(2)}%` })()}
            />
          </>
        ) : (
          <>
            <ResultCard
              label={aprToApyDir ? 'Effective Annual Rate (APY)' : 'Nominal Rate (APR)'}
              value={`${(aprToApyDir ? aprToApy(inputs.ratePct, n) : apyToApr(inputs.ratePct, n)).toFixed(4)}%`}
              highlight
            />
            <ResultCard
              label="Rate per Period"
              value={`${periodicRatePct(aprToApyDir ? inputs.ratePct : apyToApr(inputs.ratePct, n), n).toFixed(4)}%`}
            />
          </>
        )}
      </div>
    </div>
  )
}
