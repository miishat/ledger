import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeftRight, Building2, CreditCard, Home, Landmark, LineChart, Scale, ShieldCheck, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { ForecasterTool } from './forecaster/ForecasterTool'
import { CompoundInterestCalculator } from './CompoundInterestCalculator'
import { DebtPayoffCalculator } from './DebtPayoffCalculator'
import { EmergencyFundCalculator } from './EmergencyFundCalculator'
import { SavingsGoalCalculator } from './SavingsGoalCalculator'
import { CurrencyConverter } from './CurrencyConverter'
import { RaiseInflationCalculator } from './RaiseInflationCalculator'
import { MortgageCalculator } from './MortgageCalculator'
import { RentVsBuyCalculator } from './RentVsBuyCalculator'
import { SalaryTaxTool } from './SalaryTaxTool'
import { RrspVsTfsaCalculator } from './RrspVsTfsaCalculator'

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
    name: 'Net-Worth / FIRE Forecaster',
    description: 'Your history projected forward — scenarios, FIRE date, goals, Monte Carlo.',
    icon: TrendingUp,
    component: ForecasterTool,
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
  {
    id: 'mortgage',
    name: 'Mortgage',
    description: 'Payment, amortization curve, and how much house you can afford.',
    icon: Home,
    component: MortgageCalculator,
  },
  {
    id: 'rent-vs-buy',
    name: 'Rent vs Buy',
    description: 'Cumulative-cost crossover: when (if ever) buying beats renting.',
    icon: Building2,
    component: RentVsBuyCalculator,
  },
  {
    id: 'salary-tax',
    name: 'Salary & Tax',
    description: 'Gross to net for any province — 2026 tax breakdown, marginal/effective rates, CPP and EI.',
    icon: Landmark,
    component: SalaryTaxTool,
  },
  {
    id: 'rrsp-vs-tfsa',
    name: 'RRSP vs TFSA',
    description: 'Which account wins for your marginal rate now vs in retirement.',
    icon: Scale,
    component: RrspVsTfsaCalculator,
  },
]

export function getTool(id: string | undefined): PlannerTool | undefined {
  return PLANNER_TOOLS.find((t) => t.id === id)
}
