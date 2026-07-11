import React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import { futureValue, growthSeries } from '../../utils/finance/compound'
import { CalculatorField } from './CalculatorField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'
import { chartTooltipStyles } from '../../utils/chartTheme'

const TOOL_ID = 'compound-interest'
const DEFAULTS: Record<string, number> = { principal: 10000, monthlyContribution: 500, annualRatePct: 7, years: 20 }

export const CompoundInterestCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const set = (field: string) => (v: number) => setInput(TOOL_ID, field, v)

  const months = Math.max(1, Math.round(inputs.years * 12))
  const fv = futureValue(inputs.principal, inputs.annualRatePct, months, inputs.monthlyContribution)
  const contributed = inputs.principal + inputs.monthlyContribution * months
  const chartData = growthSeries(inputs.principal, inputs.annualRatePct, inputs.monthlyContribution, months)
    .filter((p) => p.month % 12 === 0)
    .map((p) => ({
      year: p.month / 12,
      contributed: Math.round(p.contributed),
      growth: Math.round(Math.max(0, p.growth)),
    }))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CalculatorField label="Starting Amount" prefix="$" step={100} value={inputs.principal} onChange={set('principal')} />
        <CalculatorField label="Monthly Contribution" prefix="$" step={50} value={inputs.monthlyContribution} onChange={set('monthlyContribution')} />
        <CalculatorField label="Annual Return" suffix="%" step={0.1} value={inputs.annualRatePct} onChange={set('annualRatePct')} />
        <CalculatorField label="Years" min={1} max={60} value={inputs.years} onChange={set('years')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label="Future Value" value={formatMoney(fv)} highlight />
        <ResultCard label="Total Contributed" value={formatMoney(contributed)} />
        <ResultCard label="Growth" value={formatMoney(fv - contributed)} />
      </div>

      <div className="themed-card rounded-lg p-4 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={72} />
            <Tooltip
              formatter={(value, name) => [formatMoney(Number(value)), String(name)]}
              {...chartTooltipStyles}
            />
            <Area type="monotone" dataKey="contributed" name="Contributed" stackId="1" stroke="var(--text-secondary)" fill="var(--text-secondary)" fillOpacity={0.25} />
            <Area type="monotone" dataKey="growth" name="Growth" stackId="1" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.35} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
