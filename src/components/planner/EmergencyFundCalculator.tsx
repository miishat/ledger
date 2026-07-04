import React from 'react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import { useBudgetStore } from '../../store/useBudgetStore'
import { averageMonthlyExpenses } from '../../store/budgetSelectors'
import { CalculatorField } from './CalculatorField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

const TOOL_ID = 'emergency-fund'
const DEFAULTS = { monthlyExpenses: 3000, targetMonths: 6, currentSavings: 5000 }
const PRESET_MONTHS = [3, 6, 12]

export const EmergencyFundCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const set = (field: string) => (v: number) => setInput(TOOL_ID, field, v)
  const transactions = useBudgetStore((s) => s.transactions)

  const budgetAvg = averageMonthlyExpenses(transactions, 3)
  const target = inputs.monthlyExpenses * inputs.targetMonths
  const gap = Math.max(0, target - inputs.currentSavings)
  const progress = target > 0 ? Math.min(1, inputs.currentSavings / target) : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <CalculatorField label="Monthly essential expenses" prefix="$" step={100} value={inputs.monthlyExpenses} onChange={set('monthlyExpenses')} />
        <CalculatorField label="Months of cover" min={1} max={24} value={inputs.targetMonths} onChange={set('targetMonths')} />
        <CalculatorField label="Current savings" prefix="$" step={100} value={inputs.currentSavings} onChange={set('currentSavings')} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRESET_MONTHS.map((m) => (
          <button
            key={m}
            onClick={() => setInput(TOOL_ID, 'targetMonths', m)}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${
              inputs.targetMonths === m
                ? 'border-accent text-accent bg-accent/10'
                : 'border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {m} months
          </button>
        ))}
        {budgetAvg > 0 && (
          <button
            onClick={() => setInput(TOOL_ID, 'monthlyExpenses', Math.round(budgetAvg))}
            className="px-3 py-1.5 rounded-md text-[13px] font-medium border border-border text-text-secondary hover:text-accent hover:border-accent transition-colors"
          >
            Use my budget avg ({formatMoney(budgetAvg)}/mo)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label="Target fund" value={formatMoney(target)} highlight />
        <ResultCard label="Gap to close" value={formatMoney(gap)} />
        <ResultCard label="Funded" value={`${Math.round(progress * 100)}%`} />
      </div>

      <div className="themed-card rounded-lg p-4">
        <div className="h-3 w-full rounded bg-bg-primary/50 overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="text-[12px] text-text-secondary mt-2">
          {gap === 0
            ? 'Fully funded — nice.'
            : `Save ${formatMoney(gap)} more to reach ${inputs.targetMonths} months of cover.`}
        </p>
      </div>
    </div>
  )
}
