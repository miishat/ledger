import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { LineChart, Target, TrendingUp } from 'lucide-react'
import { ProjectionWidget } from '../investments/ProjectionWidget'
import { CompoundInterestCalculator } from './CompoundInterestCalculator'
import { SavingsGoalCalculator } from './SavingsGoalCalculator'

export interface PlannerTool {
  id: string
  name: string
  description: string
  icon: LucideIcon
  component: React.ComponentType
}

// Single source of truth for Planner tools. The hub grid and the
// /planner/:toolId route both read from this list. Later Phase-4 sub-plans
// add calculators by appending entries here.
export const PLANNER_TOOLS: PlannerTool[] = [
  {
    id: 'forecaster',
    name: 'Net-Worth Forecaster',
    description:
      'Project your future net worth from savings and market returns. (Full FIRE forecaster lands in Phase 4e.)',
    icon: TrendingUp,
    component: ProjectionWidget,
  },
  {
    id: 'compound-interest',
    name: 'Compound Interest',
    description: 'See how a starting balance and monthly contributions grow over time.',
    icon: LineChart,
    component: CompoundInterestCalculator,
  },
  {
    id: 'savings-goal',
    name: 'Savings Goal',
    description: 'Solve for any variable: contribution, time, required return, or final balance.',
    icon: Target,
    component: SavingsGoalCalculator,
  },
]

export function getTool(id: string | undefined): PlannerTool | undefined {
  return PLANNER_TOOLS.find((t) => t.id === id)
}
