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

interface HoldingRowProps {
  holding: Holding
  rates: FxRates
  totalValueCad: number
  onPrice: (id: string, price: number, currency: Currency | null) => void
}

export const HoldingRow: React.FC<HoldingRowProps> = ({ holding, rates, totalValueCad, onPrice }) => {
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

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="py-2 pr-3">
        <span className="text-text-primary font-medium">{holding.ticker}</span>
        <span className="block text-[11px] text-text-secondary">
          <span>{holding.currency ?? 'Set currency'}</span>
          {priceUnconvertible && quoteCurrency ? (
            <span className="text-error" title={`Price quoted in ${quoteCurrency}, no rate into ${holding.currency}`}> · unconverted</span>
          ) : null}
          {live.data ? ` · ${live.data.source}${live.data.stale ? ' (stale)' : ''}` : ' · no quote'}
        </span>
      </td>
      <td className="py-2 pr-3 text-right text-text-secondary">{holding.quantity}</td>
      <td className="py-2 pr-3 text-right text-text-secondary">{holding.avgCost.toFixed(2)}</td>
      <td className="py-2 pr-3 text-right text-text-primary">
        {live.status === 'loading' && !live.data ? <Skeleton className="h-4 w-16 inline-block" /> : price.toFixed(2)}
      </td>
      <td className="py-2 pr-3 text-right text-text-primary">{formatMoney(bookValue(holding))}</td>
      <td className="py-2 pr-3 text-right text-text-primary">{formatMoney(marketValue(holding, price))}</td>
      <td className={`py-2 pr-3 text-right ${holdingPlDollars(holding, price) >= 0 ? 'text-accent' : 'text-error'}`}>
        {formatMoney(holdingPlDollars(holding, price))} ({pct(holdingPlPct(holding, price))})
      </td>
      <td data-testid="allocation-cell" className="py-2 text-right text-text-secondary">
        {valueCad === null ? '-' : pct(allocationPct(valueCad, totalValueCad))}
      </td>
    </tr>
  )
}
