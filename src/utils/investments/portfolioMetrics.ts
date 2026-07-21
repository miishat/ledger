// Pure portfolio valuation. Per-holding numbers stay in the holding's own
// currency; totals are normalized to CAD through a currency-to-CAD rate map.

import type { Currency } from '../../services/marketData/types'
import type { Holding } from '../../store/usePortfolioStore'

/** Rates into CAD, keyed by source currency. CAD is implicitly 1 and need
 *  not be present. A missing entry means the value cannot be converted. */
export type FxRates = Partial<Record<Currency, number>>

function rateToCad(currency: Currency, rates: FxRates): number | undefined {
  return currency === 'CAD' ? 1 : rates[currency]
}

export function bookValue(h: Holding): number {
  return h.quantity * h.avgCost
}

export function marketValue(h: Holding, price: number): number {
  return h.quantity * price
}

export function holdingPlDollars(h: Holding, price: number): number {
  return marketValue(h, price) - bookValue(h)
}

export function holdingPlPct(h: Holding, price: number): number | null {
  const book = bookValue(h)
  return book > 0 ? (holdingPlDollars(h, price) / book) * 100 : null
}

/** null when the currency is unknown or has no rate. */
export function toCad(value: number, currency: Currency | null, rates: FxRates): number | null {
  if (currency === null) return null
  const r = rateToCad(currency, rates)
  return r === undefined ? null : value * r
}

/** Cross rate through CAD. null when either leg is unavailable. */
export function convertAmount(
  value: number,
  from: Currency | null,
  to: Currency | null,
  rates: FxRates,
): number | null {
  if (from === null || to === null) return null
  if (from === to) return value
  const rf = rateToCad(from, rates)
  const rt = rateToCad(to, rates)
  if (rf === undefined || rt === undefined || rt === 0) return null
  return (value * rf) / rt
}

export interface PortfolioTotals {
  investedCad: number
  valueCad: number
  plCad: number
  plPct: number | null
  /** Holdings left out of the totals for want of a rate. */
  excludedCount: number
}

export function portfolioTotals(
  rows: { holding: Holding; price: number }[],
  rates: FxRates,
): PortfolioTotals {
  let investedCad = 0
  let valueCad = 0
  let excludedCount = 0
  for (const { holding, price } of rows) {
    const book = toCad(bookValue(holding), holding.currency, rates)
    const value = toCad(marketValue(holding, price), holding.currency, rates)
    if (book === null || value === null) {
      excludedCount += 1
      continue
    }
    investedCad += book
    valueCad += value
  }
  const plCad = valueCad - investedCad
  return {
    investedCad,
    valueCad,
    plCad,
    plPct: investedCad > 0 ? (plCad / investedCad) * 100 : null,
    excludedCount,
  }
}
