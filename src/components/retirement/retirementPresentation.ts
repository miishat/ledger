import { createContext } from 'react'
import type { RetirementPlanKind } from '../../utils/finance/retirementTypes'
import { formatMoney } from '../planner/format'

export const RetirementValidationContext = createContext<(id: string, invalid: boolean) => void>(() => {})
export const PLAN_NAMES: Record<RetirementPlanKind, string> = { 'group-rrsp': 'Group RRSP', 'dc-rpp': 'Defined-Contribution Pension', 'db-rpp': 'Defined-Benefit Pension', 'rrsp-dpsp': 'RRSP With DPSP Match', prpp: 'PRPP', vrsp: 'Qualifying Quebec VRSP' }
export function retirementRange(values: number[], formatter: (value: number) => string = formatMoney, emptyLabel = 'Needs Review'): string {
  if (!values.length) return emptyLabel
  if (values.some(n => !Number.isFinite(n))) return 'Needs Review'
  const [low, high] = retirementExtrema(values)
  const lowLabel = formatter(low); const highLabel = formatter(high)
  return lowLabel === highLabel ? lowLabel : `${lowLabel} to ${highLabel}`
}

export function retirementExtrema(values: number[]): [number, number] {
  let low = Infinity; let high = -Infinity
  for (const value of values) { low = Math.min(low, value); high = Math.max(high, value) }
  return [low, high]
}
