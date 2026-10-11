import { createContext } from 'react'
import type { RetirementPlanKind } from '../../utils/finance/retirementTypes'
import { formatMoney } from '../planner/format'

export const RetirementValidationContext = createContext<(id: string, invalid: boolean) => void>(() => {})
export const PLAN_NAMES: Record<RetirementPlanKind, string> = { 'group-rrsp': 'Group RRSP', 'dc-rpp': 'Defined-Contribution Pension', 'db-rpp': 'Defined-Benefit Pension', 'rrsp-dpsp': 'RRSP With DPSP Match', prpp: 'PRPP', vrsp: 'Qualifying Quebec VRSP' }
export function retirementRange(values: number[], formatter: (value: number) => string = formatMoney): string {
  if (!values.length || values.some(n => !Number.isFinite(n))) return 'Needs Review'
  const low = Math.min(...values); const high = Math.max(...values)
  const lowLabel = formatter(low); const highLabel = formatter(high)
  return lowLabel === highLabel ? lowLabel : `${lowLabel} to ${highLabel}`
}
