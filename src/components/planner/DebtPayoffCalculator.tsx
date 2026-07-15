import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import { minPaymentFor, simulatePayoff, type Debt, type DebtType, type PayoffStrategy } from '../../utils/finance/debtPayoff'
import { CalculatorField } from './CalculatorField'
import { SelectField } from './SelectField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'
import { chartTooltipStyles } from '../../utils/chartTheme'

const TOOL_ID = 'debt-payoff'
const DEFAULT_DEBTS: Debt[] = [
  { id: 'd1', name: 'Credit Card', balance: 5000, aprPct: 21.99, type: 'creditCard' },
  { id: 'd2', name: 'Car Loan', balance: 12000, aprPct: 7.5, type: 'loan', loanMode: 'term', termYears: 4 },
]
const DEFAULTS = { debtsJson: JSON.stringify(DEFAULT_DEBTS), extraMonthly: 200, strategy: 'avalanche' as string }

/** Debts stored before v0.4 have no type: treat them as loans with their
 *  saved payment, so nothing changes until the user edits them. */
function parseDebts(json: string): Debt[] {
  try {
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) return []
    return arr.map((d) => ({ type: 'loan', loanMode: 'payment', ...d }))
  } catch {
    return []
  }
}

function formatMonths(m: number | null): string {
  if (m === null) return 'Never (payments too low)'
  return `${Math.floor(m / 12)}y ${m % 12}m`
}

const MinPaymentDisplay: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div>
    <span className="text-[13px] font-medium text-text-secondary block mb-1">{label}</span>
    <div className="px-3 py-2 rounded-lg bg-bg-primary/30 border border-border text-[15px] text-text-primary">
      {formatMoney(value)}<span className="text-[12px] text-text-secondary"> /mo</span>
    </div>
  </div>
)

export const DebtPayoffCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const debts = parseDebts(inputs.debtsJson as string)
  const strategy = inputs.strategy as PayoffStrategy
  const saveDebts = (next: Debt[]) => setInput(TOOL_ID, 'debtsJson', JSON.stringify(next))
  const updateDebt = (id: string, patch: Partial<Debt>) =>
    saveDebts(debts.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  const changeType = (d: Debt, type: DebtType) => {
    if (type === 'loan') {
      updateDebt(d.id, {
        type,
        loanMode: d.loanMode ?? 'payment',
        minPayment: d.minPayment ?? Math.max(10, Math.round(minPaymentFor(d, d.balance))),
      })
    } else {
      updateDebt(d.id, { type })
    }
  }

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
            onClick={() => saveDebts([...debts, { id: crypto.randomUUID(), name: 'New Debt', balance: 1000, aprPct: 10, type: 'creditCard' }])}
            className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-accent transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Debt
          </button>
        </div>
        {debts.map((d) => {
          const autoMin = minPaymentFor(d, d.balance)
          return (
            <div key={d.id} className="flex flex-col gap-3 border-b border-border pb-3 last:border-b-0">
              <div data-testid="debt-card-header" className="flex items-center justify-between md:hidden">
                <span className="text-[14px] font-medium text-text-primary">{d.name || 'Debt'}</span>
                <button
                  onClick={() => saveDebts(debts.filter((x) => x.id !== d.id))}
                  className="p-2 rounded-lg text-text-secondary hover:text-error transition-colors"
                  aria-label={`Remove ${d.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1.4fr_1fr_1fr_auto] gap-3 items-end">
                <label className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium text-text-secondary">Name</span>
                  <input
                    className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[15px] outline-none focus:border-accent"
                    value={d.name}
                    onChange={(e) => updateDebt(d.id, { name: e.target.value })}
                  />
                </label>
                <SelectField
                  label="Type"
                  value={d.type}
                  onChange={(v) => changeType(d, v as DebtType)}
                  options={[
                    { value: 'creditCard', label: 'Credit Card' },
                    { value: 'lineOfCredit', label: 'Line of Credit' },
                    { value: 'loan', label: 'Loan' },
                  ]}
                />
                <CalculatorField label="Balance" prefix="$" step={100} value={d.balance} onChange={(v) => updateDebt(d.id, { balance: v })} />
                <CalculatorField label="APR" suffix="%" step={0.1} value={d.aprPct} onChange={(v) => updateDebt(d.id, { aprPct: v })} />
                <button
                  onClick={() => saveDebts(debts.filter((x) => x.id !== d.id))}
                  className="hidden md:flex self-end p-2 mb-2 rounded-lg text-text-secondary hover:text-error transition-colors"
                  aria-label={`Remove ${d.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-3 items-end">
                {d.type === 'loan' ? (
                  <>
                    <SelectField
                      label="Payment Input"
                      value={d.loanMode ?? 'payment'}
                      onChange={(v) => updateDebt(d.id, { loanMode: v as Debt['loanMode'] })}
                      options={[
                        { value: 'payment', label: 'I Know My Payment' },
                        { value: 'term', label: 'I Know My Term' },
                      ]}
                    />
                    {(d.loanMode ?? 'payment') === 'payment' ? (
                      <CalculatorField label="Monthly Payment" prefix="$" step={10} value={d.minPayment ?? 0} onChange={(v) => updateDebt(d.id, { minPayment: v })} />
                    ) : (
                      <>
                        <CalculatorField label="Amortization (Years)" min={1} max={40} value={d.termYears ?? 5} onChange={(v) => updateDebt(d.id, { termYears: v })} />
                        <MinPaymentDisplay label="Computed Payment" value={autoMin} />
                      </>
                    )}
                  </>
                ) : (
                  <MinPaymentDisplay label="Min Payment (Auto)" value={autoMin} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <CalculatorField label="Extra Monthly Payment" prefix="$" step={25} value={inputs.extraMonthly} onChange={(v) => setInput(TOOL_ID, 'extraMonthly', v)} />
        <SelectField
          label="Strategy"
          value={strategy}
          onChange={(v) => setInput(TOOL_ID, 'strategy', v)}
          options={[
            { value: 'avalanche', label: 'Avalanche (Highest APR First)' },
            { value: 'snowball', label: 'Snowball (Smallest Balance First)' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label={`Debt-free in (${strategy})`} value={formatMonths(chosen.months)} highlight />
        <ResultCard label="Total Interest" value={formatMoney(chosen.totalInterest)} />
        <ResultCard
          label="vs Other Strategy"
          value={other.totalInterest >= chosen.totalInterest
            ? `Saves ${formatMoney(other.totalInterest - chosen.totalInterest)}`
            : `Costs ${formatMoney(chosen.totalInterest - other.totalInterest)} More`}
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
              {...chartTooltipStyles}
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
