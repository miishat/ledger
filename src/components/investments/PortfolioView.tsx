import React, { useCallback, useMemo, useState } from 'react'
import { Trash2, Landmark, Upload, X } from 'lucide-react'
import { useFxRates } from '../../hooks/useFxRates'
import type { Currency } from '../../services/marketData/types'
import { accountNames, usePortfolioStore, type Holding } from '../../store/usePortfolioStore'
import { holdingPlDollars, marketValue, portfolioTotals, safeHoldingPrice, toCad } from '../../utils/investments/portfolioMetrics'
import { formatMoney } from '../planner/format'
import { AllocationChart } from './AllocationChart'
import { HoldingRow } from './HoldingRow'
import { HoldingCard } from './HoldingCard'
import { PortfolioImport } from './PortfolioImport'
import { PortfolioReport } from './report/PortfolioReport'
import { accountValue } from './report/reportMetrics'
import { usePortfolioReportStore } from '../../store/usePortfolioReportStore'
import { EmptyState } from '../ui/EmptyState'
import { DataFreshness } from '../ui/DataFreshness'
import { Sheet } from '../ui/Sheet'

export const PortfolioView: React.FC = () => {
  const holdings = usePortfolioStore((s) => s.holdings)
  const importedAt = usePortfolioStore((s) => s.importedAt)
  const clearHoldings = usePortfolioStore((s) => s.clearHoldings)
  const currencyReviewPending = usePortfolioStore((s) => s.currencyReviewPending)
  const dismissCurrencyReview = usePortfolioStore((s) => s.dismissCurrencyReview)
  const report = usePortfolioReportStore((s) => s.report)
  const [importOpen, setImportOpen] = useState(false)

  // The imported holdings carry no cash and no margin loan, so their sum is
  // only ever the holdings value. A PortfolioAnalyst report, when one has been
  // uploaded, reports the broker's own ending NAV, which does include both.
  const nav = accountValue(report)

  // Each row reports its raw native price and that price's own currency
  // (not a converted or fallback price), so priceFor below is the one place
  // that decides whether a price is safe to use.
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [quoteCurrencies, setQuoteCurrencies] = useState<Record<string, Currency | null>>({})
  const onPrice = useCallback((id: string, price: number, currency: Currency | null) => {
    setPrices((prev) => (prev[id] === price ? prev : { ...prev, [id]: price }))
    setQuoteCurrencies((prev) => (prev[id] === currency ? prev : { ...prev, [id]: currency }))
  }, [])

  const currencies = useMemo(
    () => [...holdings.map((h) => h.currency), ...Object.values(quoteCurrencies)],
    [holdings, quoteCurrencies],
  )
  const fx = useFxRates(currencies)
  const rates = fx.rates

  // A holding whose live quote could not be converted still has a known
  // quantity and a known cost basis in a known currency, so it belongs in the
  // total at cost rather than being dropped. Dropping it made this page
  // disagree with the dashboard rollup, which has always used the cost-basis
  // fallback: the same 8 holdings read $36,705 here and $114,937 there.
  // safeHoldingPrice is the shared rule: a live price in a currency that
  // does not match the holding's own currency, with no rate to bridge them,
  // cannot be treated as a ready-to-use price, so avgCost is used instead of
  // feeding that mismatched number into the total. `excludedCount` now
  // means only what its name says: the holding's own currency has no FX
  // rate, so no CAD figure exists for it at all.
  const priceFor = (h: Holding) => safeHoldingPrice(h, prices[h.id], quoteCurrencies[h.id], rates)
  const rows = holdings.map((h) => ({ holding: h, price: priceFor(h) }))
  const totals = portfolioTotals(rows, rates)

  type SortKey = 'ticker' | 'value' | 'pl' | 'alloc'
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'value', desc: true })

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: true }))

  // Account subtotals must price each holding exactly the way the totals
  // above do (at cost when the live quote could not be converted, at the
  // live/cached price otherwise) so the subtotals always sum to the total.
  // The `?? 0` here guards the one remaining exclusion: a holding whose own
  // currency has no FX rate, the same condition portfolioTotals excludes on.
  const valueCadOf = (h: Holding) => toCad(marketValue(h, priceFor(h)), h.currency, rates) ?? 0
  const plCadOf = (h: Holding) => toCad(holdingPlDollars(h, priceFor(h)), h.currency, rates) ?? 0

  const sortRows = (list: Holding[]) => {
    const dir = sort.desc ? -1 : 1
    return [...list].sort((a, b) => {
      if (sort.key === 'ticker') return a.ticker.localeCompare(b.ticker) * -dir
      if (sort.key === 'pl') return (plCadOf(a) - plCadOf(b)) * dir
      return (valueCadOf(a) - valueCadOf(b)) * dir // value and alloc share an order
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium border control-border text-text-primary hover:bg-bg-secondary transition-colors"
        >
          <Upload className="w-4 h-4" aria-hidden="true" /> Import holdings
        </button>
      </div>

      <Sheet
        open={importOpen}
        onClose={() => setImportOpen(false)}
        desktop="modal"
        ariaLabel="Import holdings"
        title="Import holdings"
        panelClassName="themed-menu desktop:rounded-lg desktop:overflow-hidden w-full max-w-lg"
      >
        <div className="hidden desktop:flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Import holdings</h2>
          <button
            onClick={() => setImportOpen(false)}
            aria-label="Close"
            className="text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <PortfolioImport />
        </div>
      </Sheet>

      {holdings.length === 0 ? (
        <div className="themed-card rounded-lg p-10">
          <EmptyState icon={Landmark} message="No holdings yet" hint="Import a broker CSV to see your portfolio with live values." />
        </div>
      ) : (
        <>
          {currencyReviewPending && (
            <div className="themed-card rounded-lg p-3 border border-error/40 flex items-start justify-between gap-3">
              <p className="text-[13px] text-text-secondary">
                Holdings imported before v0.7.3 stored every foreign currency as CAD. Re-import the account, or set the currency on any row that looks wrong.
              </p>
              <button
                onClick={dismissCurrencyReview}
                className="text-[12px] text-text-secondary hover:text-accent transition-colors shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className={`grid grid-cols-1 gap-4 ${nav ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
            <div className="themed-card rounded-lg p-4"><p className="text-[12px] uppercase text-text-secondary">Total Invested (CAD)</p><p className="text-[22px] font-semibold text-text-primary">{formatMoney(totals.investedCad)}</p></div>
            <div className="themed-card rounded-lg p-4"><p className="text-[12px] uppercase text-text-secondary">Holdings Value (CAD)</p><p className="text-[22px] font-semibold text-accent">{formatMoney(totals.valueCad)}</p></div>
            <div className="themed-card rounded-lg p-4">
              <p className="text-[12px] uppercase text-text-secondary">Total P/L</p>
              <p className={`text-[22px] font-semibold ${totals.plCad >= 0 ? 'text-accent' : 'text-error'}`}>
                {formatMoney(totals.plCad)}{totals.plPct !== null ? ` (${totals.plPct >= 0 ? '+' : ''}${totals.plPct.toFixed(1)}%)` : ''}
              </p>
              {totals.excludedCount > 0 && (
                <p className="text-[13px] text-error mt-1">
                  {totals.excludedCount} holding{totals.excludedCount === 1 ? '' : 's'} left out of these totals: no exchange rate for {totals.excludedCount === 1 ? 'its' : 'their'} currency.{' '}
                  <button
                    type="button"
                    onClick={() => fx.refresh()}
                    className="border control-border rounded px-1.5 py-0.5 text-[12px] hover:text-error/80 hover:border-error/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Retry exchange rates
                  </button>
                </p>
              )}
            </div>
            {nav && (
              <div className="themed-card rounded-lg p-4">
                <p className="text-[12px] uppercase text-text-secondary">Account Value ({nav.baseCurrency})</p>
                <p className="text-[22px] font-semibold text-text-primary">{formatMoney(nav.nav)}</p>
                <p className="text-meta text-text-secondary mt-1">
                  {nav.cash !== null ? `Cash ${formatMoney(nav.cash)} · ` : ''}per report{report?.period ? `, ${report.period}` : ''}
                </p>
              </div>
            )}
          </div>

          <AllocationChart rows={rows} rates={rates} />

          {accountNames(holdings).map((account) => {
            const accountHoldings = sortRows(holdings.filter((h) => h.account === account))
            const subtotalValue = accountHoldings.reduce((s, h) => s + valueCadOf(h), 0)
            const subtotalPl = accountHoldings.reduce((s, h) => s + plCadOf(h), 0)
            const headers: { key: SortKey | null; label: string; align: string }[] = [
              { key: 'ticker', label: 'Holding', align: 'text-left' },
              { key: null, label: 'Qty', align: 'text-right' },
              { key: null, label: 'Avg Cost', align: 'text-right' },
              { key: null, label: 'Price', align: 'text-right' },
              { key: null, label: 'Book', align: 'text-right' },
              { key: 'value', label: 'Value', align: 'text-right' },
              { key: 'pl', label: 'P/L', align: 'text-right' },
              { key: 'alloc', label: 'Alloc', align: 'text-right' },
            ]
            return (
              <div key={account} className="themed-card rounded-lg p-4">
                <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-border">
                  <h3 className="text-[14px] font-semibold text-text-primary">
                    {account} <span className="text-text-secondary font-normal">({accountHoldings.length})</span>
                  </h3>
                  <p data-testid={`account-subtotal-${account}`} className="text-[13px] text-text-secondary tabular-nums">
                    {formatMoney(subtotalValue)}{' '}
                    <span className={subtotalPl >= 0 ? 'text-accent' : 'text-error'}>
                      {subtotalPl >= 0 ? '+' : ''}{formatMoney(subtotalPl)}
                    </span>
                  </p>
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-[13px] min-w-[720px]">
                    <caption className="sr-only">
                      Holdings in {account}, sortable by ticker, value, profit and loss, or allocation.
                    </caption>
                    <thead>
                      <tr className="text-left text-text-secondary border-b border-border">
                        {headers.map((h) => (
                          <th
                            key={h.label}
                            scope="col"
                            aria-sort={h.key && sort.key === h.key ? (sort.desc ? 'descending' : 'ascending') : undefined}
                            className={`py-2 pr-3 font-medium ${h.align}`}
                          >
                            {h.key ? (
                              <button
                                onClick={() => toggleSort(h.key as SortKey)}
                                aria-label={`Sort by ${h.label}`}
                                className="hover:text-text-primary transition-colors"
                              >
                                {h.label}{sort.key === h.key ? (sort.desc ? ' ↓' : ' ↑') : ''}
                              </button>
                            ) : h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {accountHoldings.map((h) => (
                        <HoldingRow key={h.id} holding={h} rates={rates} totalValueCad={totals.valueCad} onPrice={onPrice} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div data-testid={`portfolio-cards-${account}`} className="md:hidden flex flex-col gap-3">
                  {accountHoldings.map((h) => (
                    <HoldingCard key={h.id} holding={h} rates={rates} totalValueCad={totals.valueCad} onPrice={onPrice} />
                  ))}
                </div>
              </div>
            )
          })}
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-text-secondary">
              Imported {importedAt ? new Date(importedAt).toLocaleString() : 'never'}
              {Object.keys(rates).length > 0
                ? ` · rates into CAD: ${Object.entries(rates)
                  .map(([c, r]) => `${c} ${r.toFixed(4)}${fx.sources[c as Currency] ? ` (${fx.sources[c as Currency]})` : ''}`)
                  .join(', ')}`
                : ''}
              {Object.keys(rates).length > 0 && fx.asOf && (
                <>
                  {' '}
                  <DataFreshness source={fx.source} asOf={fx.asOf} stale={fx.stale} onRefresh={fx.refresh} label="exchange rate" />
                </>
              )}
            </p>
            <button onClick={clearHoldings} className="flex items-center gap-1 text-[12px] text-text-secondary hover:text-error transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Clear portfolio
            </button>
          </div>
        </>
      )}

      <PortfolioReport />
    </div>
  )
}
