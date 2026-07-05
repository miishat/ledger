import React from 'react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import {
  amortizationSchedule, monthlyPayment, principalFromPayment, scheduleTotalInterest,
} from '../../utils/finance/amortization'
import { CalculatorField } from './CalculatorField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

const TOOL_ID = 'mortgage'
const DEFAULTS = {
  mode: 'payment' as string,
  price: 600000,
  downPct: 20,
  ratePct: 4.5,
  years: 25,
  // affordability mode
  income: 120000,
  gdsPct: 39,
  propertyTaxMonthly: 350,
}
const HEATING_MONTHLY = 150 // CMHC GDS convention

export const MortgageCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const set = (field: string) => (v: number) => setInput(TOOL_ID, field, v)
  const mode = inputs.mode as 'payment' | 'affordability'

  const downPayment = inputs.price * (inputs.downPct / 100)
  const principal = inputs.price - downPayment
  const payment = monthlyPayment(principal, inputs.ratePct, inputs.years)
  const schedule = amortizationSchedule(principal, inputs.ratePct, inputs.years)
  const chartData = schedule
    .filter((p) => p.month % 12 === 0)
    .map((p) => ({ year: p.month / 12, balance: Math.round(p.balance) }))

  const housingBudget = (inputs.income * (inputs.gdsPct / 100)) / 12 - inputs.propertyTaxMonthly - HEATING_MONTHLY
  const affordablePrincipal = Math.max(0, principalFromPayment(housingBudget, inputs.ratePct, inputs.years))
  const affordablePrice = affordablePrincipal + downPayment

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {(['payment', 'affordability'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setInput(TOOL_ID, 'mode', m)}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${
              mode === m ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {m === 'payment' ? 'Payment' : 'Affordability'}
          </button>
        ))}
      </div>

      {mode === 'payment' ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CalculatorField label="Home price" prefix="$" step={5000} value={inputs.price} onChange={set('price')} />
            <CalculatorField label="Down payment" suffix="%" min={0} max={100} step={1} value={inputs.downPct} onChange={set('downPct')} />
            <CalculatorField label="Rate" suffix="%" step={0.05} value={inputs.ratePct} onChange={set('ratePct')} />
            <CalculatorField label="Amortization (years)" min={1} max={35} value={inputs.years} onChange={set('years')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard label="Monthly payment" value={formatMoney(payment)} highlight />
            <ResultCard label="Total interest" value={formatMoney(scheduleTotalInterest(schedule))} />
            <ResultCard label="Down payment" value={formatMoney(downPayment)} />
          </div>
          <div className="themed-card rounded-lg p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                <XAxis dataKey="year" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={72} />
                <Tooltip
                  formatter={(value, name) => [formatMoney(Number(value)), String(name)]}
                  contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="balance" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CalculatorField label="Gross annual income" prefix="$" step={1000} value={inputs.income} onChange={set('income')} />
            <CalculatorField label="GDS ratio" suffix="%" min={20} max={50} step={1} value={inputs.gdsPct} onChange={set('gdsPct')} />
            <CalculatorField label="Property tax / month" prefix="$" step={25} value={inputs.propertyTaxMonthly} onChange={set('propertyTaxMonthly')} />
            <CalculatorField label="Rate" suffix="%" step={0.05} value={inputs.ratePct} onChange={set('ratePct')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard label="Max home price" value={formatMoney(affordablePrice)} highlight />
            <ResultCard label="Max mortgage" value={formatMoney(affordablePrincipal)} />
            <ResultCard label="Housing budget / month" value={formatMoney(Math.max(0, housingBudget))} />
          </div>
          <p className="text-[13px] text-text-secondary">
            GDS-style estimate: {inputs.gdsPct}% of gross income minus property tax and {formatMoney(HEATING_MONTHLY)} heating,
            with your current down payment of {formatMoney(downPayment)} added on top. Lenders also apply stress tests, treated here as a ceiling.
          </p>
        </>
      )}
    </div>
  )
}
