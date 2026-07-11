import React from 'react'
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import { rentVsBuy } from '../../utils/finance/rentVsBuy'
import { CalculatorField } from './CalculatorField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'
import { chartTooltipStyles } from '../../utils/chartTheme'

const TOOL_ID = 'rent-vs-buy'
const DEFAULTS = {
  monthlyRent: 2200, rentIncreasePct: 3,
  price: 600000, downPct: 20, ratePct: 4.5, amortYears: 25,
  propertyTaxPct: 0.8, maintenancePct: 1, opportunityPct: 5,
  horizonYears: 15,
}

export const RentVsBuyCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const set = (field: string) => (v: number) => setInput(TOOL_ID, field, v)

  const r = rentVsBuy(inputs)
  const chartData = r.series.map((p) => ({
    year: p.year, Renting: Math.round(p.rentCost), Buying: Math.round(p.buyCost),
  }))
  const last = r.series[r.series.length - 1]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <CalculatorField label="Monthly Rent" prefix="$" step={50} value={inputs.monthlyRent} onChange={set('monthlyRent')} />
        <CalculatorField label="Rent Increase" suffix="%/yr" step={0.5} value={inputs.rentIncreasePct} onChange={set('rentIncreasePct')} />
        <CalculatorField label="Home Price" prefix="$" step={5000} value={inputs.price} onChange={set('price')} />
        <CalculatorField label="Down Payment" suffix="%" min={0} max={100} value={inputs.downPct} onChange={set('downPct')} />
        <CalculatorField label="Mortgage Rate" suffix="%" step={0.05} value={inputs.ratePct} onChange={set('ratePct')} />
        <CalculatorField label="Property Tax" suffix="%/yr" step={0.1} value={inputs.propertyTaxPct} onChange={set('propertyTaxPct')} />
        <CalculatorField label="Maintenance" suffix="%/yr" step={0.1} value={inputs.maintenancePct} onChange={set('maintenancePct')} />
        <CalculatorField label="Investment Return (Opportunity)" suffix="%" step={0.5} value={inputs.opportunityPct} onChange={set('opportunityPct')} />
        <CalculatorField label="Horizon (Years)" min={1} max={40} value={inputs.horizonYears} onChange={set('horizonYears')} />
        <CalculatorField label="Amortization (Years)" min={1} max={35} value={inputs.amortYears} onChange={set('amortYears')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard
          label="Break-even"
          value={r.breakEvenYear === null ? 'Renting wins in this horizon' : `Year ${r.breakEvenYear}`}
          highlight
        />
        <ResultCard label={`Renting cost by year ${last?.year ?? 0}`} value={formatMoney(last?.rentCost ?? 0)} />
        <ResultCard label={`Buying cost by year ${last?.year ?? 0}`} value={formatMoney(last?.buyCost ?? 0)} />
      </div>

      <div className="themed-card rounded-lg p-4 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={72} />
            <Tooltip
              formatter={(value, name) => [formatMoney(Number(value)), String(name)]}
              {...chartTooltipStyles}
            />
            <Legend />
            <Line type="monotone" dataKey="Renting" stroke="var(--text-secondary)" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="Buying" stroke="var(--accent)" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-[12px] text-text-secondary mt-2">
          Cumulative unrecoverable costs only: rent vs interest, taxes, maintenance and the return your down payment could have earned.
        </p>
      </div>
    </div>
  )
}
