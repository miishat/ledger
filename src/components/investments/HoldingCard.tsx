import React, { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useCurrentPrice } from '../../services/marketData'
import { CURRENCIES, type Currency } from '../../services/marketData/types'
import { usePortfolioStore, type Holding } from '../../store/usePortfolioStore'
import {
  bookValue, convertedPrice, holdingPlDollars, holdingPlPct, marketValue, quoteCurrencyForHolding, toCad, type FxRates,
} from '../../utils/investments/portfolioMetrics'
import { allocationPct } from '../../utils/investments/analysisMetrics'
import { formatMoney } from '../planner/format'
import { pct, share } from './holdingMetrics'
import { Skeleton } from '../ui/Skeleton'
import { ThemedSelect } from '../ui/ThemedSelect'
import { DataFreshness } from '../ui/DataFreshness'

interface HoldingCardProps {
  holding: Holding
  rates: FxRates
  totalValueCad: number
  onPrice: (id: string, price: number, currency: Currency | null) => void
}

export const HoldingCard: React.FC<HoldingCardProps> = ({ holding, rates, totalValueCad, onPrice }) => {
  const setHoldingCurrency = usePortfolioStore((s) => s.setHoldingCurrency)
  const live = useCurrentPrice(holding.ticker, holding.exchange)
  // Not live.data.value.currency directly: an override's currency is a
  // placeholder the service cannot fill in correctly. See
  // quoteCurrencyForHolding.
  const quoteCurrency = quoteCurrencyForHolding(holding, live.data?.value.currency, live.data?.source)
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
  // effectivePrice so this card's own numbers sum to the subtotal above it
  // instead of showing a dash the totals silently disagree with. The
  // "unconverted" marker above still tells the user the live price itself
  // could not be used.
  const effectivePrice = priceUnconvertible ? holding.avgCost : price
  const valueCad = toCad(marketValue(holding, effectivePrice), holding.currency, rates)
  const plDollars = holdingPlDollars(holding, effectivePrice)
  const isLoadingPrice = live.status === 'loading' && !live.data
  const [open, setOpen] = useState(false)
  const detailId = `holding-card-detail-${holding.id}`

  return (
    <div className="themed-card rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={detailId}
            aria-label={`Details for ${holding.ticker}`}
            className="inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 text-text-secondary transition-transform ${open ? 'rotate-90' : ''}`}
              aria-hidden="true"
            />
            <span className="text-[15px] font-semibold text-text-primary">{holding.ticker}</span>
          </button>
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
        </div>
        {isLoadingPrice ? (
          <Skeleton className="h-4 w-20 inline-block" />
        ) : (
          <span data-testid="pl-cell" className={`text-[14px] font-semibold tabular-nums ${plDollars >= 0 ? 'text-accent' : 'text-error'}`}>
            {formatMoney(plDollars)} ({pct(holdingPlPct(holding, effectivePrice))})
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
        <span className="text-text-secondary">Qty</span><span className="text-right tabular-nums">{holding.quantity}</span>
        <span className="text-text-secondary">Price</span>
        <span className="text-right tabular-nums">
          {isLoadingPrice ? <Skeleton className="h-4 w-16 inline-block" /> : price.toFixed(2)}
        </span>
        <span className="text-text-secondary">Alloc</span>
        <span data-testid="allocation-cell" className="text-right tabular-nums">
          {isLoadingPrice ? (
            <Skeleton className="h-4 w-12 inline-block" />
          ) : valueCad === null ? (
            '-'
          ) : (
            <>
              <span className="tabular-nums">{share(allocationPct(valueCad, totalValueCad))}</span>
              <span className="block h-1 mt-1 rounded bg-bg-primary/50 overflow-hidden">
                <span
                  className="block h-full bg-accent"
                  style={{ width: `${Math.min(100, Math.max(0, allocationPct(valueCad, totalValueCad) ?? 0))}%` }}
                />
              </span>
            </>
          )}
        </span>
        <span className="text-text-secondary">Value</span>
        <span data-testid="value-cell" className="text-right tabular-nums">
          {isLoadingPrice
            ? <Skeleton className="h-4 w-16 inline-block" />
            : formatMoney(marketValue(holding, effectivePrice))}
        </span>
      </div>
      {open && (
        <div id={detailId} className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] rounded-md bg-bg-primary/50 px-2 py-2">
          <span className="text-text-secondary">Avg Cost</span><span className="text-right tabular-nums">{holding.avgCost.toFixed(2)}</span>
          <span className="text-text-secondary">Book</span><span className="text-right tabular-nums">{formatMoney(bookValue(holding))}</span>
        </div>
      )}
    </div>
  )
}
