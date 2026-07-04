// Broker CSV → holdings, following the src/utils/csvParser.ts pattern:
// named parser configs with detect(headers) + parse(row), plus an
// "unrecognized" result that the UI resolves with a generic column mapper.
// Broker export formats drift — the named parsers cover the common IBKR
// and Wealthsimple holdings exports; the mapper is the guaranteed path.

import Papa from 'papaparse'
import type { Currency } from '../services/marketData'
import type { Holding } from '../store/usePortfolioStore'

export interface UnrecognizedPortfolioCSV {
  unrecognized: true
  headers: string[]
  rows: Record<string, string>[]
}

export interface PortfolioParserConfig {
  name: string
  detect: (headers: string[]) => boolean
  parse: (row: Record<string, string>) => Omit<Holding, 'id'> | null
}

function toCurrency(raw: string | undefined): Currency {
  return raw?.trim().toUpperCase() === 'USD' ? 'USD' : 'CAD'
}

function positive(raw: string | undefined): number | null {
  const n = parseFloat(String(raw ?? '').replace(/[$,]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

export const PORTFOLIO_PARSERS: PortfolioParserConfig[] = [
  {
    name: 'Interactive Brokers',
    detect: (headers) => headers.includes('Symbol') && headers.includes('Cost Basis'),
    parse: (row) => {
      const quantity = positive(row['Quantity'])
      const costBasis = positive(row['Cost Basis'])
      const ticker = row['Symbol']?.trim()
      if (!ticker || quantity === null || costBasis === null) return null
      return {
        ticker: ticker.toUpperCase(),
        name: row['Description']?.trim() || undefined,
        quantity,
        avgCost: costBasis / quantity,
        currency: toCurrency(row['Currency']),
      }
    },
  },
  {
    name: 'Wealthsimple',
    detect: (headers) => headers.includes('Symbol') && headers.includes('Book Value'),
    parse: (row) => {
      const quantity = positive(row['Quantity'])
      const bookValue = positive(row['Book Value'])
      const ticker = row['Symbol']?.trim()
      if (!ticker || quantity === null || bookValue === null) return null
      return {
        ticker: ticker.toUpperCase(),
        name: row['Name']?.trim() || undefined,
        quantity,
        avgCost: bookValue / quantity,
        currency: toCurrency(row['Currency']),
      }
    },
  },
]

export function parsePortfolioText(
  text: string,
): Omit<Holding, 'id'>[] | UnrecognizedPortfolioCSV {
  const results = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
  const headers = results.meta.fields ?? []
  const parser = PORTFOLIO_PARSERS.find((p) => p.detect(headers))
  if (!parser) return { unrecognized: true, headers, rows: results.data }
  const holdings: Omit<Holding, 'id'>[] = []
  for (const row of results.data) {
    const parsed = parser.parse(row)
    if (parsed) holdings.push(parsed)
  }
  return holdings
}

export async function parsePortfolioCSV(
  file: File,
): Promise<Omit<Holding, 'id'>[] | UnrecognizedPortfolioCSV> {
  return parsePortfolioText(await file.text())
}

export interface ColumnMapping {
  ticker: string
  quantity: string
  totalCost: string
  currency?: string
}

export function mapPortfolioRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
): Omit<Holding, 'id'>[] {
  const holdings: Omit<Holding, 'id'>[] = []
  for (const row of rows) {
    const ticker = row[mapping.ticker]?.trim()
    const quantity = positive(row[mapping.quantity])
    const totalCost = positive(row[mapping.totalCost])
    if (!ticker || quantity === null || totalCost === null) continue
    holdings.push({
      ticker: ticker.toUpperCase(),
      quantity,
      avgCost: totalCost / quantity,
      currency: toCurrency(mapping.currency ? row[mapping.currency] : undefined),
    })
  }
  return holdings
}
