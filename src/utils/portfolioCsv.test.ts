import { mapPortfolioRows, parsePortfolioText } from './portfolioCsv'

const ibkrCsv = `Symbol,Description,Quantity,Cost Basis,Currency
AAPL,APPLE INC,10,1800,USD
VFV,VANGUARD SP500,100,12000,CAD`

const wsCsv = `Symbol,Name,Quantity,Book Value,Currency
XEQT,iShares All-Equity,50,1500,CAD`

const unknownCsv = `Ticker,Units,Total Paid
SHOP,5,600`

describe('parsePortfolioText', () => {
  it('parses the IBKR format', () => {
    const r = parsePortfolioText(ibkrCsv)
    expect(Array.isArray(r)).toBe(true)
    const holdings = r as Exclude<typeof r, { unrecognized: true }>
    expect(holdings).toHaveLength(2)
    expect(holdings[0]).toMatchObject({ ticker: 'AAPL', quantity: 10, avgCost: 180, currency: 'USD' })
    expect(holdings[1]).toMatchObject({ ticker: 'VFV', avgCost: 120, currency: 'CAD' })
  })

  it('parses the Wealthsimple format', () => {
    const r = parsePortfolioText(wsCsv)
    const holdings = r as Exclude<typeof r, { unrecognized: true }>
    expect(holdings[0]).toMatchObject({ ticker: 'XEQT', name: 'iShares All-Equity', quantity: 50, avgCost: 30, currency: 'CAD' })
  })

  it('returns unrecognized with headers + rows for unknown formats', () => {
    const r = parsePortfolioText(unknownCsv)
    expect(r).toMatchObject({ unrecognized: true, headers: ['Ticker', 'Units', 'Total Paid'] })
  })
})

describe('mapPortfolioRows', () => {
  it('maps arbitrary columns and derives avgCost', () => {
    const r = parsePortfolioText(unknownCsv)
    if (!('unrecognized' in r)) throw new Error('expected unrecognized')
    const mapped = mapPortfolioRows(r.rows, { ticker: 'Ticker', quantity: 'Units', totalCost: 'Total Paid' })
    expect(mapped).toHaveLength(1)
    expect(mapped[0]).toMatchObject({ ticker: 'SHOP', quantity: 5, avgCost: 120, currency: 'CAD' })
  })

  it('skips unparseable rows', () => {
    const mapped = mapPortfolioRows(
      [{ Ticker: 'X', Units: 'abc', 'Total Paid': '10' }],
      { ticker: 'Ticker', quantity: 'Units', totalCost: 'Total Paid' },
    )
    expect(mapped).toHaveLength(0)
  })
})
