import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import {
  amortizationSchedule, amortizationScheduleWithExtras, monthlyPayment, principalFromPayment,
  scheduleTotalInterest, type ExtraPayment,
} from '../../utils/finance/amortization'
import { CalculatorField } from './CalculatorField'
import { ResultCard } from './ResultCard'
import { ThemedSelect } from '../ui/ThemedSelect'
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
  extras: '[]' as string,
}
const HEATING_MONTHLY = 150 // CMHC GDS convention

export const MortgageCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const set = (field: string) => (v: number) => setInput(TOOL_ID, field, v)
  const mode = inputs.mode as 'payment' | 'affordability'

  const extras: ExtraPayment[] = React.useMemo(() => {
    try { return JSON.parse((inputs.extras as unknown as string) || '[]') } catch { return [] }
  }, [inputs.extras])
  const setExtras = (next: ExtraPayment[]) => setInput(TOOL_ID, 'extras', JSON.stringify(next))

  const downPayment = inputs.price * (inputs.downPct / 100)
  const principal = inputs.price - downPayment
  const payment = monthlyPayment(principal, inputs.ratePct, inputs.years)
  const schedule = amortizationSchedule(principal, inputs.ratePct, inputs.years)
  const scheduleWithExtras = amortizationScheduleWithExtras(principal, inputs.ratePct, inputs.years, extras)
  const interestSaved = scheduleTotalInterest(schedule) - scheduleTotalInterest(scheduleWithExtras)
  const monthsSaved = schedule.length - scheduleWithExtras.length
  const chartData = schedule
    .filter((p) => p.month % 12 === 0)
    .map((p) => ({
      year: p.month / 12,
      baseline: Math.round(p.balance),
      withExtras: Math.round(scheduleWithExtras.find((q) => q.month === p.month)?.balance ?? 0),
    }))

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

          <div className="themed-card rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] uppercase tracking-wide text-text-secondary">Extra payments</p>
              <button type="button" onClick={() => setExtras([...extras, { id: crypto.randomUUID(), kind: 'recurring', amount: 200, fromYear: 1, toYear: inputs.years }])}
                className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-accent">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {extras.length === 0 && <p className="text-[13px] text-text-secondary">None yet. Add recurring monthly extras for a range of years, or one-time lump sums.</p>}
            {extras.map((e) => (
              <div key={e.id} className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-3 items-end">
                <div>
                  <label className="text-[13px] font-medium text-text-secondary block mb-1">Type</label>
                  <ThemedSelect value={e.kind} options={[{ value: 'recurring', label: 'Monthly extra' }, { value: 'oneTime', label: 'One-time lump sum' }]}
                    onChange={(v) => setExtras(extras.map((x) => x.id === e.id ? { ...x, kind: v as ExtraPayment['kind'] } : x))} />
                </div>
                <CalculatorField label={e.kind === 'recurring' ? 'Amount / month' : 'Amount'} prefix="$" step={100} value={e.amount}
                  onChange={(v) => setExtras(extras.map((x) => x.id === e.id ? { ...x, amount: v } : x))} />
                <CalculatorField label={e.kind === 'recurring' ? 'From year' : 'In year'} min={1} max={inputs.years} value={e.fromYear}
                  onChange={(v) => setExtras(extras.map((x) => x.id === e.id ? { ...x, fromYear: v } : x))} />
                {e.kind === 'recurring' ? (
                  <CalculatorField label="To year" min={e.fromYear} max={inputs.years} value={e.toYear}
                    onChange={(v) => setExtras(extras.map((x) => x.id === e.id ? { ...x, toYear: v } : x))} />
                ) : <div />}
                <button type="button" aria-label="Remove extra payment" onClick={() => setExtras(extras.filter((x) => x.id !== e.id))}
                  className="p-2 text-text-secondary hover:text-error self-end"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {extras.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ResultCard label="Interest saved" value={formatMoney(interestSaved)} highlight />
              <ResultCard label="Paid off sooner by" value={`${Math.floor(monthsSaved / 12)}y ${monthsSaved % 12}m`} />
              <ResultCard label="New payoff time" value={`${Math.floor(scheduleWithExtras.length / 12)}y ${scheduleWithExtras.length % 12}m`} />
            </div>
          )}

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
                <Area type="monotone" dataKey="baseline" stroke={extras.length > 0 ? 'var(--text-secondary)' : 'var(--accent)'}
                  fill={extras.length > 0 ? 'var(--text-secondary)' : 'var(--accent)'} fillOpacity={extras.length > 0 ? 0.12 : 0.25} />
                {extras.length > 0 && (
                  <Area type="monotone" dataKey="withExtras" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.25} />
                )}
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
