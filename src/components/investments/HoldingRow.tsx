import React, { useEffect } from 'react'
import { useCurrentPrice } from '../../services/marketData'
import type { Holding } from '../../store/usePortfolioStore'
import {
  bookValue, holdingPlDollars, holdingPlPct, marketValue, toCad,
} from '../../utils/investments/portfolioMetrics'
import { allocationPct } from '../../utils/investments/analysisMetrics'
import { formatMoney } from '../planner/format'
import { Skeleton } from '../ui/Skeleton'

interface HoldingRowProps {
  holding: Holding
  fxUsdCad: number
  totalValueCad: number
  onPrice: (id: string, price: number) => void
}

const pct = (v: number | null) => (v === null ? '-' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`)

export const HoldingRow: React.FC<HoldingRowProps> = ({ holding, fxUsdCad, totalValueCad, onPrice }) => {
  const live = useCurrentPrice(holding.ticker, holding.exchange)
  const price = live.data?.value.price ?? holding.avgCost

  useEffect(() => {
    onPrice(holding.id, price) // parent keeps last-reported price; guarded upstream
  }, [holding.id, price, onPrice])

  const valueCad = toCad(marketValue(holding, price), holding.currency, fxUsdCad)

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="py-2 pr-3">
        <span className="text-text-primary font-medium">{holding.ticker}</span>
        <span className="block text-[11px] text-text-secondary">
          {holding.currency}{live.data ? ` · ${live.data.source}${live.data.stale ? ' (stale)' : ''}` : ' · no quote'}
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
      <td className="py-2 text-right text-text-secondary">{pct(allocationPct(valueCad, totalValueCad))}</td>
    </tr>
  )
}
