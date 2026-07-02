import type { Currency, HistoricalPrice, Quote } from '../types'
import { toDateKey } from '../dateKey'

export const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

function normalizeCurrency(c: unknown): Currency {
  return c === 'CAD' ? 'CAD' : 'USD'
}

interface YahooResult {
  meta?: { regularMarketPrice?: number; currency?: string; regularMarketTime?: number }
  timestamp?: number[]
  indicators?: { quote?: Array<{ close?: Array<number | null> }> }
}

async function getChart(url: string): Promise<YahooResult> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Yahoo request failed: ${res.status}`)
  const json = (await res.json()) as { chart?: { result?: YahooResult[] } }
  const result = json.chart?.result?.[0]
  if (!result) throw new Error('Yahoo response missing result')
  return result
}

export async function fetchYahooQuote(ticker: string, exchange?: string): Promise<Quote> {
  const symbol = encodeURIComponent(ticker.trim())
  const result = await getChart(`${YAHOO_BASE}/${symbol}?interval=1d&range=1d`)
  const price = result.meta?.regularMarketPrice
  if (typeof price !== 'number' || !Number.isFinite(price)) {
    throw new Error('Yahoo response missing price')
  }
  const asOf = result.meta?.regularMarketTime
    ? new Date(result.meta.regularMarketTime * 1000).toISOString()
    : new Date().toISOString()
  return { ticker: ticker.trim(), exchange, price, currency: normalizeCurrency(result.meta?.currency), asOf }
}

export async function fetchYahooHistorical(
  ticker: string,
  exchange: string | undefined,
  date: string,
): Promise<HistoricalPrice> {
  const target = new Date(`${toDateKey(date)}T00:00:00Z`)
  const period2 = Math.floor(target.getTime() / 1000) + 86400
  const period1 = period2 - 15 * 86400 // ~15-day window to survive weekends/holidays
  const symbol = encodeURIComponent(ticker.trim())
  const result = await getChart(
    `${YAHOO_BASE}/${symbol}?interval=1d&period1=${period1}&period2=${period2}`,
  )
  const stamps = result.timestamp ?? []
  const closes = result.indicators?.quote?.[0]?.close ?? []
  const targetKey = toDateKey(date)

  let chosen: number | undefined
  for (let i = 0; i < stamps.length; i++) {
    const key = toDateKey(new Date(stamps[i] * 1000))
    const close = closes[i]
    if (key <= targetKey && typeof close === 'number' && Number.isFinite(close)) {
      chosen = close // keep advancing to the nearest-on-or-before
    }
  }
  if (chosen === undefined) throw new Error('Yahoo historical: no close on/before date')

  return {
    ticker: ticker.trim(),
    exchange,
    date: targetKey,
    close: chosen,
    currency: normalizeCurrency(result.meta?.currency),
    asOf: new Date().toISOString(),
  }
}
