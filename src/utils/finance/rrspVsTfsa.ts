// RRSP vs TFSA for one pre-tax dollar amount. RRSP contributions are
// deductible (invest the full amount, taxed at withdrawal); TFSA is funded
// with after-tax dollars and withdrawn tax-free. Growth uses ./compound.ts
// monthly compounding with no ongoing contributions.

import { futureValue } from './compound'

export interface RrspTfsaComparison {
  rrspNet: number
  tfsaNet: number
  recommendation: 'RRSP' | 'TFSA' | 'Either'
}

export function compareRrspTfsa(
  preTaxAmount: number,
  marginalNowPct: number,
  marginalRetirePct: number,
  annualReturnPct: number,
  years: number,
): RrspTfsaComparison {
  const months = Math.round(years * 12)
  const rrspNet = futureValue(preTaxAmount, annualReturnPct, months) * (1 - marginalRetirePct / 100)
  const tfsaNet = futureValue(preTaxAmount * (1 - marginalNowPct / 100), annualReturnPct, months)
  const diff = rrspNet - tfsaNet
  const tolerance = Math.max(1, tfsaNet * 0.001)
  const recommendation = Math.abs(diff) <= tolerance ? 'Either' : diff > 0 ? 'RRSP' : 'TFSA'
  return { rrspNet, tfsaNet, recommendation }
}
