// Pure portfolio valuation. Per-holding numbers stay in the holding's own
// currency; totals are normalized to CAD via one USD→CAD rate.

import type { Holding } from '../../store/usePortfolioStore'

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

export function toCad(value: number, currency: 'USD' | 'CAD', fxUsdCad: number): number {
  return currency === 'USD' ? value * fxUsdCad : value
}

export interface PortfolioTotals {
  investedCad: number
  valueCad: number
  plCad: number
  plPct: number | null
}

export function portfolioTotals(
  rows: { holding: Holding; price: number }[],
  fxUsdCad: number,
): PortfolioTotals {
  let investedCad = 0
  let valueCad = 0
  for (const { holding, price } of rows) {
    investedCad += toCad(bookValue(holding), holding.currency, fxUsdCad)
    valueCad += toCad(marketValue(holding, price), holding.currency, fxUsdCad)
  }
  const plCad = valueCad - investedCad
  return { investedCad, valueCad, plCad, plPct: investedCad > 0 ? (plCad / investedCad) * 100 : null }
}
