import React, { useCallback, useMemo, useState } from 'react'
import { Trash2, Landmark } from 'lucide-react'
import { useFxRates } from '../../hooks/useFxRates'
import type { Currency } from '../../services/marketData/types'
import { accountNames, usePortfolioStore, type Holding } from '../../store/usePortfolioStore'
import { holdingPlDollars, marketValue, portfolioTotals, toCad } from '../../utils/investments/portfolioMetrics'
import { formatMoney } from '../planner/format'
import { AllocationChart } from './AllocationChart'
import { HoldingRow } from './HoldingRow'
import { HoldingCard } from './HoldingCard'
import { PortfolioImport } from './PortfolioImport'
import { PortfolioReport } from './report/PortfolioReport'
import { EmptyState } from '../ui/EmptyState'

export const PortfolioView: React.FC = () => {
  const holdings = usePortfolioStore((s) => s.holdings)
  const importedAt = usePortfolioStore((s) => s.importedAt)
  const clearHoldings = usePortfolioStore((s) => s.clearHoldings)
  const currencyReviewPending = usePortfolioStore((s) => s.currencyReviewPending)
  const dismissCurrencyReview = usePortfolioStore((s) => s.dismissCurrencyReview)

  const [prices, setPrices] = useState<Record<string, number>>({})
  const [quoteCurrencies, setQuoteCurrencies] = useState<Record<string, Currency | null>>({})
  const [unconvertibleIds, setUnconvertibleIds] = useState<Record<string, boolean>>({})
  const onPrice = useCallback((id: string, price: number, currency: Currency | null, unconvertible: boolean) => {
    setPrices((prev) => (prev[id] === price ? prev : { ...prev, [id]: price }))
    setQuoteCurrencies((prev) => (prev[id] === currency ? prev : { ...prev, [id]: currency }))
    setUnconvertibleIds((prev) => (prev[id] === unconvertible ? prev : { ...prev, [id]: unconvertible }))
  }, [])

  const currencies = useMemo(
    () => [...holdings.map((h) => h.currency), ...Object.values(quoteCurrencies)],
    [holdings, quoteCurrencies],
  )
  const fx = useFxRates(currencies)
  const rates = fx.rates

  // A holding whose live quote could not be converted into its own currency
  // has no usable price in that currency, so it is left out of portfolioTotals
  // entirely rather than feeding it a wrong-currency price. It is folded into
  // the same excluded count as a holding that lacks an FX rate outright.
  const rows = holdings
    .filter((h) => !unconvertibleIds[h.id])
    .map((h) => ({ holding: h, price: prices[h.id] ?? h.avgCost }))
  const rawTotals = portfolioTotals(rows, rates)
  const unconvertibleCount = holdings.filter((h) => unconvertibleIds[h.id]).length
  const totals = { ...rawTotals, excludedCount: rawTotals.excludedCount + unconvertibleCount }

  type SortKey = 'ticker' | 'value' | 'pl' | 'alloc'
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'value', desc: true })

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: true }))

  // valueCadOf/plCadOf fold an unconvertible holding to 0 rather than
  // dropping it, so account subtotals sum to the same total the portfolio
  // header shows (an unconvertible holding contributes nothing either way).
  const valueCadOf = (h: Holding) =>
    toCad(marketValue(h, prices[h.id] ?? h.avgCost), h.currency, rates) ?? 0
  const plCadOf = (h: Holding) =>
    toCad(holdingPlDollars(h, prices[h.id] ?? h.avgCost), h.currency, rates) ?? 0

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
      <PortfolioImport />

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="themed-card rounded-lg p-4"><p className="text-[12px] uppercase text-text-secondary">Total Invested (CAD)</p><p className="text-[22px] font-semibold text-text-primary">{formatMoney(totals.investedCad)}</p></div>
            <div className="themed-card rounded-lg p-4"><p className="text-[12px] uppercase text-text-secondary">Value Now (CAD)</p><p className="text-[22px] font-semibold text-accent">{formatMoney(totals.valueCad)}</p></div>
            <div className="themed-card rounded-lg p-4">
              <p className="text-[12px] uppercase text-text-secondary">Total P/L</p>
              <p className={`text-[22px] font-semibold ${totals.plCad >= 0 ? 'text-accent' : 'text-error'}`}>
                {formatMoney(totals.plCad)}{totals.plPct !== null ? ` (${totals.plPct >= 0 ? '+' : ''}${totals.plPct.toFixed(1)}%)` : ''}
              </p>
              {totals.excludedCount > 0 && (
                <p className="text-[11px] text-error mt-1">
                  {totals.excludedCount} holding{totals.excludedCount === 1 ? '' : 's'} excluded, no FX rate
                </p>
              )}
            </div>
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
                    <thead>
                      <tr className="text-left text-text-secondary border-b border-border">
                        {headers.map((h) => (
                          <th key={h.label} className={`py-2 pr-3 font-medium ${h.align}`}>
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
              {fx.stale ? ' (stale)' : ''}
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
