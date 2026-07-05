import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import { simulatePayoff, type Debt, type PayoffStrategy } from '../../utils/finance/debtPayoff'
import { CalculatorField } from './CalculatorField'
import { SelectField } from './SelectField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

const TOOL_ID = 'debt-payoff'
const DEFAULT_DEBTS: Debt[] = [
  { id: 'd1', name: 'Credit card', balance: 5000, aprPct: 21.99, minPayment: 150 },
  { id: 'd2', name: 'Car loan', balance: 12000, aprPct: 7.5, minPayment: 300 },
]
const DEFAULTS = { debtsJson: JSON.stringify(DEFAULT_DEBTS), extraMonthly: 200, strategy: 'avalanche' as string }

function parseDebts(json: string): Debt[] {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function formatMonths(m: number | null): string {
  if (m === null) return 'Never (payments too low)'
  return `${Math.floor(m / 12)}y ${m % 12}m`
}

export const DebtPayoffCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const debts = parseDebts(inputs.debtsJson as string)
  const strategy = inputs.strategy as PayoffStrategy
  const saveDebts = (next: Debt[]) => setInput(TOOL_ID, 'debtsJson', JSON.stringify(next))
  const updateDebt = (id: string, patch: Partial<Debt>) =>
    saveDebts(debts.map((d) => (d.id === id ? { ...d, ...patch } : d)))

  const chosen = simulatePayoff(debts, inputs.extraMonthly, strategy)
  const other = simulatePayoff(debts, inputs.extraMonthly, strategy === 'avalanche' ? 'snowball' : 'avalanche')
  const chartData = chosen.series.map((p, i) => ({
    month: p.month,
    [strategy]: Math.round(p.total),
    ...(other.series[i] ? { [strategy === 'avalanche' ? 'snowball' : 'avalanche']: Math.round(other.series[i].total) } : {}),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="themed-card rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] uppercase tracking-wide text-text-secondary">Debts</p>
          <button
            onClick={() => saveDebts([...debts, { id: crypto.randomUUID(), name: 'New debt', balance: 1000, aprPct: 10, minPayment: 50 }])}
            className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-accent transition-colors"
          >
            <Plus className="w-4 h-4" /> Add debt
          </button>
        </div>
        {debts.map((d) => (
          <div key={d.id} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end border-b border-border pb-3 last:border-b-0">
            <label className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-text-secondary">Name</span>
              <input
                className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[15px] outline-none focus:border-accent"
                value={d.name}
                onChange={(e) => updateDebt(d.id, { name: e.target.value })}
              />
            </label>
            <CalculatorField label="Balance" prefix="$" step={100} value={d.balance} onChange={(v) => updateDebt(d.id, { balance: v })} />
            <CalculatorField label="APR" suffix="%" step={0.1} value={d.aprPct} onChange={(v) => updateDebt(d.id, { aprPct: v })} />
            <CalculatorField label="Min payment" prefix="$" step={10} value={d.minPayment} onChange={(v) => updateDebt(d.id, { minPayment: v })} />
            <button
              onClick={() => saveDebts(debts.filter((x) => x.id !== d.id))}
              className="justify-self-start p-2 rounded-lg text-text-secondary hover:text-error transition-colors"
              aria-label={`Remove ${d.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <CalculatorField label="Extra monthly payment" prefix="$" step={25} value={inputs.extraMonthly} onChange={(v) => setInput(TOOL_ID, 'extraMonthly', v)} />
        <SelectField
          label="Strategy"
          value={strategy}
          onChange={(v) => setInput(TOOL_ID, 'strategy', v)}
          options={[
            { value: 'avalanche', label: 'Avalanche (highest APR first)' },
            { value: 'snowball', label: 'Snowball (smallest balance first)' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label={`Debt-free in (${strategy})`} value={formatMonths(chosen.months)} highlight />
        <ResultCard label="Total interest" value={formatMoney(chosen.totalInterest)} />
        <ResultCard
          label="vs other strategy"
          value={other.totalInterest >= chosen.totalInterest
            ? `saves ${formatMoney(other.totalInterest - chosen.totalInterest)}`
            : `costs ${formatMoney(chosen.totalInterest - other.totalInterest)} more`}
        />
      </div>

      <div className="themed-card rounded-lg p-4 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={72} />
            <Tooltip
              formatter={(value, name) => [formatMoney(Number(value)), String(name)]}
              contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            <Legend />
            <Line type="monotone" dataKey="avalanche" stroke="var(--accent)" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="snowball" stroke="var(--text-secondary)" dot={false} strokeWidth={2} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
