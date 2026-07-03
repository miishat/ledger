import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeftRight, CreditCard, LineChart, ShieldCheck, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { ProjectionWidget } from '../investments/ProjectionWidget'
import { CompoundInterestCalculator } from './CompoundInterestCalculator'
import { DebtPayoffCalculator } from './DebtPayoffCalculator'
import { EmergencyFundCalculator } from './EmergencyFundCalculator'
import { SavingsGoalCalculator } from './SavingsGoalCalculator'
import { CurrencyConverter } from './CurrencyConverter'
import { RaiseInflationCalculator } from './RaiseInflationCalculator'

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
  {
    id: 'emergency-fund',
    name: 'Emergency Fund',
    description: 'How many months of expenses you have covered, and the gap to your target.',
    icon: ShieldCheck,
    component: EmergencyFundCalculator,
  },
  {
    id: 'currency-converter',
    name: 'Currency Converter',
    description: 'USD ⇄ CAD with live rates, historical lookup, and manual fallback.',
    icon: ArrowLeftRight,
    component: CurrencyConverter,
  },
  {
    id: 'raise-inflation',
    name: 'Raise vs Inflation',
    description: 'Is my raise a real raise? Nominal vs inflation-adjusted.',
    icon: TrendingDown,
    component: RaiseInflationCalculator,
  },
  {
    id: 'debt-payoff',
    name: 'Debt Payoff',
    description: 'Snowball vs avalanche — payoff date, total interest, extra-payment impact.',
    icon: CreditCard,
    component: DebtPayoffCalculator,
  },
]

export function getTool(id: string | undefined): PlannerTool | undefined {
  return PLANNER_TOOLS.find((t) => t.id === id)
}
