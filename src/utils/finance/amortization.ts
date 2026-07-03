// Loan amortization math. Conventions: rates are PERCENT (6 = 6%), interest
// compounds monthly at annualRate/12 (consumer-loan convention; Canadian
// fixed mortgages legally use semi-annual compounding — difference is small
// and documented here as a simplification), payments at end of month.

export interface AmortizationPoint {
  month: number
  interestPaid: number
  principalPaid: number
  balance: number
}

export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const n = Math.round(years * 12)
  if (n <= 0) return principal
  const r = annualRatePct / 100 / 12
  if (r === 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

/** Largest principal a given monthly payment can service — inverse of monthlyPayment. */
export function principalFromPayment(payment: number, annualRatePct: number, years: number): number {
  const n = Math.round(years * 12)
  if (n <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return payment * n
  return (payment * (1 - Math.pow(1 + r, -n))) / r
}

export function amortizationSchedule(
  principal: number,
  annualRatePct: number,
  years: number,
  extraMonthly = 0,
): AmortizationPoint[] {
  const r = annualRatePct / 100 / 12
  const basePayment = monthlyPayment(principal, annualRatePct, years)
  const points: AmortizationPoint[] = []
  let balance = principal
  const maxMonths = Math.round(years * 12) + 1 // extra guard month for rounding
  for (let m = 1; m <= maxMonths && balance > 1e-6; m++) {
    const interest = balance * r
    const principalPortion = Math.min(basePayment + extraMonthly - interest, balance)
    balance = Math.max(0, balance - principalPortion)
    points.push({ month: m, interestPaid: interest, principalPaid: principalPortion, balance })
  }
  return points
}

export function scheduleTotalInterest(schedule: AmortizationPoint[]): number {
  return schedule.reduce((sum, p) => sum + p.interestPaid, 0)
}
