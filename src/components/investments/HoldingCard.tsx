import React, { useEffect } from 'react'
import { useCurrentPrice } from '../../services/marketData'
import type { Holding } from '../../store/usePortfolioStore'
import {
  bookValue, holdingPlDollars, holdingPlPct, marketValue, toCad,
} from '../../utils/investments/portfolioMetrics'
import { allocationPct } from '../../utils/investments/analysisMetrics'
import { formatMoney } from '../planner/format'
import { pct } from './HoldingRow'
import { Skeleton } from '../ui/Skeleton'

interface HoldingCardProps {
  holding: Holding
  fxUsdCad: number
  totalValueCad: number
  onPrice: (id: string, price: number) => void
}

export const HoldingCard: React.FC<HoldingCardProps> = ({ holding, fxUsdCad, totalValueCad, onPrice }) => {
  const live = useCurrentPrice(holding.ticker, holding.exchange)
  const price = live.data?.value.price ?? holding.avgCost

  useEffect(() => {
    onPrice(holding.id, price) // parent keeps last-reported price; guarded upstream
  }, [holding.id, price, onPrice])

  const valueCad = toCad(marketValue(holding, price), holding.currency, fxUsdCad)
  const plDollars = holdingPlDollars(holding, price)
  const isLoadingPrice = live.status === 'loading' && !live.data

  return (
    <div className="themed-card rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[15px] font-semibold text-text-primary">{holding.ticker}</span>
          <span className="block text-[11px] text-text-secondary">
            {holding.currency}{live.data ? ` · ${live.data.source}${live.data.stale ? ' (stale)' : ''}` : ' · no quote'}
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
        <span className="text-right tabular-nums">
          {isLoadingPrice ? <Skeleton className="h-4 w-12 inline-block" /> : pct(allocationPct(valueCad, totalValueCad))}
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
