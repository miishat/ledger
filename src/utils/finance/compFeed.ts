// Extracts future compensation cash events as forecast lump sums.
// RSU: real vest dates from generateVestEvents. Bonus: yearly at
// pkg.cashBonusMonth. ESPP: SIMPLIFICATION — the store has no per-purchase
// dates, so the annual ESPP gain lands every 12 months from now.

import {
  calcAnnualBonus,
  calcAnnualESPP,
  generateVestEvents,
  type CompensationPackage,
} from '../../store/useCompensationStore'
import type { LumpSum } from './forecast'

function monthOffset(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

export function compLumpSums(
  pkg: CompensationPackage,
  currentPrice: number,
  horizonMonths: number,
  now: Date = new Date(),
): LumpSum[] {
  const lumps: LumpSum[] = []

  // RSU vest events on their real dates.
  for (const grant of pkg.rsuGrants) {
    for (const event of generateVestEvents(grant, currentPrice)) {
      if (!event.date || event.vestValue <= 0) continue
      const offset = monthOffset(now, new Date(event.date))
      if (offset >= 1 && offset <= horizonMonths) {
        lumps.push({ month: offset, amount: event.vestValue, label: `RSU ${grant.grantName}` })
      }
    }
  }

  // Annual cash bonus at its configured month.
  const bonus = calcAnnualBonus(pkg)
  if (bonus > 0) {
    let bonusDate = new Date(now.getFullYear(), pkg.cashBonusMonth - 1, 1)
    if (monthOffset(now, bonusDate) < 1) {
      bonusDate = new Date(now.getFullYear() + 1, pkg.cashBonusMonth - 1, 1)
    }
    for (let offset = monthOffset(now, bonusDate); offset <= horizonMonths; offset += 12) {
      lumps.push({ month: offset, amount: bonus, label: 'Bonus' })
    }
  }

  // ESPP annual gain — simplified to every 12 months (no purchase dates in store).
  const espp = calcAnnualESPP(pkg)
  if (espp > 0) {
    for (let offset = 12; offset <= horizonMonths; offset += 12) {
      lumps.push({ month: offset, amount: espp, label: 'ESPP' })
    }
  }

  return lumps.sort((a, b) => a.month - b.month)
}
