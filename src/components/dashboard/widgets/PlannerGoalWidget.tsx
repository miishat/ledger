import React from 'react'
import { Target } from 'lucide-react'
import { WidgetWrapper } from '../WidgetWrapper'
import { usePlannerStore } from '../../../store/usePlannerStore'
import { useAccountsStore } from '../../../store/useAccountsStore'
import { formatMoney } from '../../planner/format'
import { EmptyState } from '../../ui/EmptyState'

interface Goal { id: string; label: string; amount: number }

export const PlannerGoalWidget: React.FC = () => {
  const goalsJson = usePlannerStore((s) => s.inputs['forecaster']?.goalsJson)
  const netWorth = useAccountsStore((s) => s.getNetWorth())

  let goals: Goal[] = []
  try {
    const parsed = JSON.parse(String(goalsJson ?? '[]'))
    if (Array.isArray(parsed)) goals = parsed
  } catch { /* ignore malformed */ }

  const top = [...goals].sort((a, b) => b.amount - a.amount)[0]
  if (!top) {
    return (
      <WidgetWrapper title="Top Goal">
        <EmptyState
          icon={Target}
          message="No goal set"
          hint="Set a savings target in the Forecaster and its progress shows here."
          action={{ label: 'Add a goal', to: '/planner/forecaster' }}
        />
      </WidgetWrapper>
    )
  }
  const progress = top.amount > 0 ? Math.min(1, netWorth / top.amount) : 0

  return (
    <WidgetWrapper title="Top Goal">
      <div className="flex flex-col gap-2 mt-2">
        <span className="text-[15px] text-text-primary font-medium">{top.label}</span>
        <span className="text-[13px] text-text-secondary">{formatMoney(netWorth)} of {formatMoney(top.amount)} ({Math.round(progress * 100)}%)</span>
        <div className="h-2 rounded bg-bg-primary/50 overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </WidgetWrapper>
  )
}
