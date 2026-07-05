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

export type PlannerToolGroup =
  | 'Forecasting & Growth'
  | 'Savings'
  | 'Debt & Housing'
  | 'Income & Tax'
  | 'Utilities'

/** Hub section + dropdown order. */
export const PLANNER_GROUPS: PlannerToolGroup[] = [
  'Forecasting & Growth',
  'Savings',
  'Debt & Housing',
  'Income & Tax',
  'Utilities',
]

export interface ToolInfo {
  howTo: string
  params: Array<{ name: string; description: string }>
}

export interface PlannerTool {
  id: string
  name: string
  description: string
  group: PlannerToolGroup
  icon: LucideIcon
  component: React.ComponentType
  info: ToolInfo
}

// Single source of truth for Planner tools. The hub grid and the
// /planner/:toolId route both read from this list. Later Phase-4 sub-plans
// add calculators by appending entries here.
export const PLANNER_TOOLS: PlannerTool[] = [
  {
    id: 'forecaster',
    name: 'Net-Worth / FIRE Forecaster',
    description: 'Your history projected forward: scenarios, FIRE date, goals, Monte Carlo.',
    group: 'Forecasting & Growth',
    icon: TrendingUp,
    component: ForecasterTool,
    info: {
      howTo: 'Project your net worth forward. Start from your dashboard net worth or a manual balance, set monthly savings and assumptions, then read the FI number, projected FI date, and Monte Carlo odds below the chart.',
      params: [
        { name: 'Starting balance', description: 'Where the projection begins. Auto mode pulls your dashboard net worth; manual lets you type any figure.' },
        { name: 'Monthly savings', description: 'How much you add every month across all accounts.' },
        { name: 'Years', description: 'How far into the future the chart projects.' },
        { name: 'Return', description: 'Expected average annual investment return, in percent, before inflation.' },
        { name: 'Inflation', description: 'Expected annual inflation. Real (today\'s dollars) mode subtracts this from returns.' },
        { name: 'Contribution step-up', description: 'Annual percent increase to your monthly savings, modeling raises.' },
        { name: 'Scenario spread', description: 'Plus or minus percent applied to the return to draw optimistic and pessimistic bands.' },
        { name: 'Comp events / debt drag', description: 'Include vesting events from Compensation and ongoing debt payments in the projection.' },
        { name: 'Annual spending in retirement', description: 'What you expect to spend per year once retired. Sets the FI target.' },
        { name: 'Withdrawal rate', description: 'The percent of your portfolio you plan to withdraw each year in retirement. FI number = spending divided by this rate.' },
        { name: 'Volatility (std dev)', description: 'How much returns swing year to year in the Monte Carlo simulation. 15 is a typical stock-heavy portfolio.' },
      ],
    },
  },
  {
    id: 'compound-interest',
    name: 'Compound Interest',
    description: 'See how a starting balance and monthly contributions grow over time.',
    group: 'Forecasting & Growth',
    icon: LineChart,
    component: CompoundInterestCalculator,
    info: {
      howTo: 'See how a starting balance plus monthly contributions grows. Adjust the rate and years and watch the balance curve.',
      params: [
        { name: 'Starting amount', description: 'The lump sum you begin with.' },
        { name: 'Monthly contribution', description: 'How much you add every month.' },
        { name: 'Annual return', description: 'Expected average annual growth rate, in percent.' },
        { name: 'Years', description: 'How long the money grows before you check the result.' },
      ],
    },
  },
  {
    id: 'savings-goal',
    name: 'Savings Goal',
    description: 'Solve for any variable: contribution, time, required return, or final balance.',
    group: 'Savings',
    icon: Target,
    component: SavingsGoalCalculator,
    info: {
      howTo: 'Pick which variable to solve for, fill in the other three, and the tool computes the missing one.',
      params: [
        { name: 'Solve for', description: 'Choose the unknown: final balance, monthly contribution, years, or required return.' },
        { name: 'Starting amount', description: 'The lump sum you begin with.' },
        { name: 'Monthly contribution', description: 'How much you add every month.' },
        { name: 'Annual return', description: 'Expected average annual growth rate, in percent.' },
        { name: 'Years', description: 'How long the money grows before reaching the goal.' },
      ],
    },
  },
  {
    id: 'emergency-fund',
    name: 'Emergency Fund',
    description: 'How many months of expenses you have covered, and the gap to your target.',
    group: 'Savings',
    icon: ShieldCheck,
    component: EmergencyFundCalculator,
    info: {
      howTo: 'Enter monthly expenses, current fund, and a target in months to see coverage and the gap.',
      params: [
        { name: 'Monthly essential expenses', description: 'What you need to cover basics each month: housing, food, utilities, minimum debt payments.' },
        { name: 'Months of cover', description: 'How many months of expenses you want the fund to cover before you feel secure.' },
        { name: 'Current savings', description: 'How much you already have set aside for emergencies.' },
      ],
    },
  },
  {
    id: 'currency-converter',
    name: 'Currency Converter',
    description: 'USD ⇄ CAD with live rates, historical lookup, and manual fallback.',
    group: 'Utilities',
    icon: ArrowLeftRight,
    component: CurrencyConverter,
    info: {
      howTo: 'Convert USD and CAD using live rates. Pick a historical date for past rates, or type a manual rate if offline.',
      params: [
        { name: 'Amount', description: 'The amount you want to convert, in the currency you are converting from.' },
        { name: 'Direction', description: 'Swap between converting USD to CAD or CAD to USD.' },
        { name: 'Rate date (optional)', description: 'Look up the exchange rate as of a past date instead of the live rate.' },
        { name: 'Manual rate override', description: 'Type a rate to use instead of the live or historical lookup, useful when offline.' },
      ],
    },
  },
  {
    id: 'raise-inflation',
    name: 'Raise vs Inflation',
    description: 'Is my raise a real raise? Nominal vs inflation-adjusted.',
    group: 'Income & Tax',
    icon: TrendingDown,
    component: RaiseInflationCalculator,
    info: {
      howTo: 'Compare your raise to inflation to see the real change in buying power.',
      params: [
        { name: 'Old salary', description: 'Your salary before the raise.' },
        { name: 'New salary', description: 'Your salary after the raise.' },
        { name: 'Inflation', description: 'Expected or actual annual inflation over the period, in percent.' },
      ],
    },
  },
  {
    id: 'debt-payoff',
    name: 'Debt Payoff',
    description: 'Snowball vs avalanche: payoff date, total interest, extra-payment impact.',
    group: 'Debt & Housing',
    icon: CreditCard,
    component: DebtPayoffCalculator,
    info: {
      howTo: 'List your debts with balance, APR, and minimum payment. Choose avalanche (highest APR first) or snowball (smallest balance first), add any extra monthly amount, and compare payoff time and interest.',
      params: [
        { name: 'Balance', description: 'How much you currently owe on that debt.' },
        { name: 'APR', description: 'Annual percentage rate for that debt.' },
        { name: 'Min payment', description: 'The minimum monthly payment required on that debt.' },
        { name: 'Extra monthly payment', description: 'Amount above the minimums applied to the target debt each month.' },
        { name: 'Strategy', description: 'Avalanche pays off the highest APR debt first to minimize interest. Snowball pays off the smallest balance first for quick wins.' },
      ],
    },
  },
  {
    id: 'mortgage',
    name: 'Mortgage',
    description: 'Payment, amortization curve, and how much house you can afford.',
    group: 'Debt & Housing',
    icon: Home,
    component: MortgageCalculator,
    info: {
      howTo: 'Payment mode computes the monthly payment and amortization curve from price, down payment, rate, and years. Affordability mode estimates the largest home price your income supports.',
      params: [
        { name: 'Home price', description: 'The purchase price of the home.' },
        { name: 'Down payment', description: 'Percent of price paid upfront. The rest is the mortgage principal.' },
        { name: 'Rate', description: 'Annual interest rate. Interest compounds monthly here, a small simplification of Canadian semi-annual compounding.' },
        { name: 'Amortization (years)', description: 'How many years the mortgage is scheduled to be paid off over.' },
        { name: 'Gross annual income', description: 'Your household gross income before tax, used to estimate affordability.' },
        { name: 'GDS ratio', description: 'Gross Debt Service: the percent of gross income lenders allow for housing costs, typically up to 39.' },
        { name: 'Property tax / month', description: 'Estimated monthly property tax, factored into the affordability calculation.' },
      ],
    },
  },
  {
    id: 'rent-vs-buy',
    name: 'Rent vs Buy',
    description: 'Cumulative-cost crossover: when (if ever) buying beats renting.',
    group: 'Debt & Housing',
    icon: Building2,
    component: RentVsBuyCalculator,
    info: {
      howTo: 'Compare cumulative cost of renting vs buying over time and find the crossover year, if any.',
      params: [
        { name: 'Monthly rent', description: 'What you currently pay in rent per month.' },
        { name: 'Rent increase', description: 'Expected annual percent increase in rent.' },
        { name: 'Home price', description: 'The purchase price of the home you would buy instead.' },
        { name: 'Down payment', description: 'Percent of price paid upfront. The rest becomes the mortgage principal.' },
        { name: 'Mortgage rate', description: 'Annual interest rate on the mortgage.' },
        { name: 'Property tax', description: 'Estimated annual property tax as a percent of home price.' },
        { name: 'Maintenance', description: 'Estimated annual maintenance and upkeep cost as a percent of home price.' },
        { name: 'Investment return (opportunity)', description: 'The annual return your down payment could earn if invested instead of used to buy, used to weigh the true cost of tying up that cash.' },
        { name: 'Horizon (years)', description: 'How many years the comparison runs before it stops, even if renting is still cheaper.' },
        { name: 'Amortization (years)', description: 'How many years the mortgage is scheduled to be paid off over.' },
      ],
    },
  },
  {
    id: 'salary-tax',
    name: 'Salary & Tax',
    description: 'Gross to net for any province. 2026 tax breakdown, marginal/effective rates, CPP and EI.',
    group: 'Income & Tax',
    icon: Landmark,
    component: SalaryTaxTool,
    info: {
      howTo: 'Enter gross income and province for a full 2026 tax breakdown: federal and provincial brackets, CPP and EI, net pay per period. Add RRSP and FHSA contributions to see the tax you save.',
      params: [
        { name: 'Gross annual income', description: 'Your total income before tax and deductions.' },
        { name: 'Province', description: 'Your province of residence, which determines the provincial tax brackets applied.' },
        { name: 'RRSP contribution', description: 'Deducted from taxable income. Limit is 18% of last year\'s earned income up to the annual maximum.' },
        { name: 'FHSA contribution', description: 'First Home Savings Account deposits, deductible like RRSP. Annual limit $8,000.' },
        { name: 'Marginal rate', description: 'Tax on your next dollar earned.' },
        { name: 'Effective rate', description: 'Total tax divided by total income.' },
      ],
    },
  },
  {
    id: 'rrsp-vs-tfsa',
    name: 'RRSP vs TFSA',
    description: 'Which account wins for your marginal rate now vs in retirement.',
    group: 'Income & Tax',
    icon: Scale,
    component: RrspVsTfsaCalculator,
    info: {
      howTo: 'Compares RRSP and TFSA outcomes for your marginal rate now vs in retirement.',
      params: [],
    },
  },
]

export function getTool(id: string | undefined): PlannerTool | undefined {
  return PLANNER_TOOLS.find((t) => t.id === id)
}
