import React, { useEffect } from 'react'
import { useCurrentPrice } from '../../services/marketData'
import { CURRENCIES, type Currency } from '../../services/marketData/types'
import { usePortfolioStore, type Holding } from '../../store/usePortfolioStore'
import {
  bookValue, convertedPrice, holdingPlDollars, holdingPlPct, marketValue, toCad, type FxRates,
} from '../../utils/investments/portfolioMetrics'
import { allocationPct } from '../../utils/investments/analysisMetrics'
import { formatMoney } from '../planner/format'
import { pct } from './holdingMetrics'
import { Skeleton } from '../ui/Skeleton'
import { ThemedSelect } from '../ui/ThemedSelect'
import { DataFreshness } from '../ui/DataFreshness'

interface HoldingRowProps {
  holding: Holding
  rates: FxRates
  totalValueCad: number
  onPrice: (id: string, price: number, currency: Currency | null) => void
}

export const HoldingRow: React.FC<HoldingRowProps> = ({ holding, rates, totalValueCad, onPrice }) => {
  const setHoldingCurrency = usePortfolioStore((s) => s.setHoldingCurrency)
  const live = useCurrentPrice(holding.ticker, holding.exchange)
  const quoteCurrency = live.data?.value.currency ?? holding.currency
  const nativePrice = live.data?.value.price ?? holding.avgCost

  // The quote's currency is authoritative for the price; convert it into the
  // holding's currency so value and P/L compare against the cost basis.
  const converted = convertedPrice(holding, nativePrice, quoteCurrency, rates)
  const priceUnconvertible = converted === null
  const price = converted ?? nativePrice

  useEffect(() => {
    // Report the raw native price and its currency, not the converted (or
    // unconvertible-fallback) price above: the parent recomputes safety
    // itself via safeHoldingPrice, the same rule the dashboard rollup uses,
    // so the two surfaces cannot silently disagree about it.
    onPrice(holding.id, nativePrice, quoteCurrency)
  }, [holding.id, nativePrice, quoteCurrency, onPrice])

  // A price that cannot be converted into the holding's own currency is not
  // usable for value/P&L/allocation, but the holding does not vanish from
  // the account: the parent (safeHoldingPrice) already values it at cost
  // basis in the subtotal and header totals. Mirror that here with
  // effectivePrice so this row's own numbers sum to the subtotal above it
  // instead of showing a dash the totals silently disagree with. The
  // "unconverted" marker above still tells the user the live price itself
  // could not be used.
  const effectivePrice = priceUnconvertible ? holding.avgCost : price
  const valueCad = toCad(marketValue(holding, effectivePrice), holding.currency, rates)

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="py-2 pr-3">
        <span data-testid="holding-ticker" className="text-text-primary font-medium">{holding.ticker}</span>
        <span className="block text-meta text-text-secondary">
          <span className="inline-flex align-middle items-center">
            <ThemedSelect
              value={holding.currency ?? ''}
              onChange={(v) => setHoldingCurrency(holding.id, v ? (v as Currency) : null)}
              ariaLabel={`Currency for ${holding.ticker}`}
              className="!w-auto !px-1.5 !py-0 !text-meta !rounded"
              options={[
                { value: '', label: 'Set currency' },
                ...CURRENCIES.map((c) => ({ value: c, label: c })),
              ]}
            />
          </span>
          {priceUnconvertible && quoteCurrency ? (
            <span className="text-error" title={`Price quoted in ${quoteCurrency}, no rate into ${holding.currency ?? 'unset currency'}`}> · unconverted</span>
          ) : null}
          {live.data ? (
            <>
              {' · '}
              <DataFreshness
                source={live.data.source}
                asOf={live.data.asOf}
                stale={live.data.stale}
                onRefresh={() => live.refresh(true)}
                label={`${holding.ticker} price`}
              />
            </>
          ) : (
            ' · no quote'
          )}
        </span>
      </td>
      <td className="py-2 pr-3 text-right text-text-secondary">{holding.quantity}</td>
      <td className="py-2 pr-3 text-right text-text-secondary">{holding.avgCost.toFixed(2)}</td>
      <td className="py-2 pr-3 text-right text-text-primary">
        {live.status === 'loading' && !live.data ? <Skeleton className="h-4 w-16 inline-block" /> : price.toFixed(2)}
      </td>
      <td className="py-2 pr-3 text-right text-text-primary">{formatMoney(bookValue(holding))}</td>
      <td data-testid="value-cell" className="py-2 pr-3 text-right text-text-primary">
        {formatMoney(marketValue(holding, effectivePrice))}
      </td>
      <td
        data-testid="pl-cell"
        className={`py-2 pr-3 text-right ${
          holdingPlDollars(holding, effectivePrice) >= 0 ? 'text-accent' : 'text-error'
        }`}
      >
        {formatMoney(holdingPlDollars(holding, effectivePrice))} ({pct(holdingPlPct(holding, effectivePrice))})
      </td>
      <td data-testid="allocation-cell" className="py-2 text-right text-text-secondary">
        {valueCad === null ? (
          '-'
        ) : (
          <>
            <span className="tabular-nums">{pct(allocationPct(valueCad, totalValueCad))}</span>
            <span data-testid="allocation-bar" className="block h-1 mt-1 rounded bg-bg-primary/50 overflow-hidden">
              <span
                className="block h-full bg-accent"
                style={{ width: `${Math.min(100, Math.max(0, allocationPct(valueCad, totalValueCad) ?? 0))}%` }}
              />
            </span>
          </>
        )}
      </td>
    </tr>
  )
}
