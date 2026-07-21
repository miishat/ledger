import React, { useEffect } from 'react'
import { useCurrentPrice } from '../../services/marketData'
import type { Currency } from '../../services/marketData/types'
import type { Holding } from '../../store/usePortfolioStore'
import {
  bookValue, convertAmount, holdingPlDollars, holdingPlPct, marketValue, toCad, type FxRates,
} from '../../utils/investments/portfolioMetrics'
import { allocationPct } from '../../utils/investments/analysisMetrics'
import { formatMoney } from '../planner/format'
import { pct } from './holdingMetrics'
import { Skeleton } from '../ui/Skeleton'

interface HoldingCardProps {
  holding: Holding
  rates: FxRates
  totalValueCad: number
  onPrice: (id: string, price: number, currency: Currency | null) => void
}

export const HoldingCard: React.FC<HoldingCardProps> = ({ holding, rates, totalValueCad, onPrice }) => {
  const live = useCurrentPrice(holding.ticker, holding.exchange)
  const quoteCurrency = live.data?.value.currency ?? holding.currency
  const nativePrice = live.data?.value.price ?? holding.avgCost

  // The quote's currency is authoritative for the price; convert it into the
  // holding's currency so value and P/L compare against the cost basis.
  const converted =
    quoteCurrency === holding.currency
      ? nativePrice
      : convertAmount(nativePrice, quoteCurrency, holding.currency, rates)
  const priceUnconvertible = converted === null
  const price = converted ?? nativePrice

  useEffect(() => {
    onPrice(holding.id, price, quoteCurrency) // parent keeps last-reported price; guarded upstream
  }, [holding.id, price, quoteCurrency, onPrice])

  const valueCad = toCad(marketValue(holding, price), holding.currency, rates)
  const plDollars = holdingPlDollars(holding, price)
  const isLoadingPrice = live.status === 'loading' && !live.data

  return (
    <div className="themed-card rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[15px] font-semibold text-text-primary">{holding.ticker}</span>
          <span className="block text-[11px] text-text-secondary">
            <span>{holding.currency ?? 'Set currency'}</span>
            {priceUnconvertible && quoteCurrency ? (
              <span className="text-error" title={`Price quoted in ${quoteCurrency}, no rate into ${holding.currency}`}> · unconverted</span>
            ) : null}
            {live.data ? ` · ${live.data.source}${live.data.stale ? ' (stale)' : ''}` : ' · no quote'}
          </span>
        </div>
        {isLoadingPrice ? (
          <Skeleton className="h-4 w-20 inline-block" />
        ) : (
          <span className={`text-[14px] font-semibold tabular-nums ${plDollars >= 0 ? 'text-accent' : 'text-error'}`}>
            {formatMoney(plDollars)} ({pct(holdingPlPct(holding, price))})
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
        <span className="text-text-secondary">Qty</span><span className="text-right tabular-nums">{holding.quantity}</span>
        <span className="text-text-secondary">Avg Cost</span><span className="text-right tabular-nums">{holding.avgCost.toFixed(2)}</span>
        <span className="text-text-secondary">Price</span>
        <span className="text-right tabular-nums">
          {isLoadingPrice ? <Skeleton className="h-4 w-16 inline-block" /> : price.toFixed(2)}
        </span>
        <span className="text-text-secondary">Alloc</span>
        <span data-testid="allocation-cell" className="text-right tabular-nums">
          {isLoadingPrice
            ? <Skeleton className="h-4 w-12 inline-block" />
            : valueCad === null ? '-' : pct(allocationPct(valueCad, totalValueCad))}
        </span>
        <span className="text-text-secondary">Book</span><span className="text-right tabular-nums">{formatMoney(bookValue(holding))}</span>
        <span className="text-text-secondary">Value</span>
        <span className="text-right tabular-nums">
          {isLoadingPrice ? <Skeleton className="h-4 w-16 inline-block" /> : formatMoney(marketValue(holding, price))}
        </span>
      </div>
    </div>
  )
}
