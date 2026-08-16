import React from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import { nominalRaisePct, realRaisePct } from '../../utils/finance/raise'
import { CalculatorField } from './CalculatorField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

const TOOL_ID = 'raise-inflation'
const DEFAULTS = { oldSalary: 100000, newSalary: 105000, inflationPct: 3 }

type VerdictTone = 'raise' | 'lost' | 'wash'

function verdictFor(real: number): { tone: VerdictTone; text: string } {
  if (real > 0.25) {
    return { tone: 'raise', text: `A real raise: your purchasing power grew ${real.toFixed(2)}%.` }
  }
  if (real < -0.25) {
    return {
      tone: 'lost',
      text: `Not a real raise. Inflation ate it. You're down ${Math.abs(real).toFixed(2)}% in purchasing power.`,
    }
  }
  return { tone: 'wash', text: 'A wash: your raise roughly matches inflation.' }
}

const TONE_STYLES: Record<VerdictTone, { banner: string; icon: string }> = {
  raise: { banner: 'border-accent/50 bg-accent/10', icon: 'text-accent' },
  lost: { banner: 'border-error/50 bg-error/10', icon: 'text-error' },
  wash: { banner: 'border-border bg-bg-primary/40', icon: 'text-text-secondary' },
}

const TONE_ICONS: Record<VerdictTone, React.ElementType> = {
  raise: TrendingUp,
  lost: TrendingDown,
  wash: Minus,
}

export const RaiseInflationCalculator: React.FC = () => {
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const setInput = usePlannerStore((s) => s.setInput)
  const set = (field: string) => (v: number) => setInput(TOOL_ID, field, v)

  const nominal = nominalRaisePct(inputs.oldSalary, inputs.newSalary)
  const real = realRaisePct(nominal, inputs.inflationPct)
  const realDollars = inputs.oldSalary * (real / 100)

  const { tone, text: verdict } = verdictFor(real)
  const ToneIcon = TONE_ICONS[tone]

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

      <div role="status" className={`flex items-center gap-2 rounded-lg border p-4 ${TONE_STYLES[tone].banner}`}>
        <ToneIcon className={`w-5 h-5 shrink-0 ${TONE_STYLES[tone].icon}`} aria-hidden="true" />
        <p className="text-[14px] text-text-primary">{verdict}</p>
      </div>
    </div>
  )
}
