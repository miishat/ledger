import React, { useEffect } from 'react'
import { useCurrentPrice } from '../../services/marketData'
import { CURRENCIES, type Currency } from '../../services/marketData/types'
import { usePortfolioStore, type Holding } from '../../store/usePortfolioStore'
import {
  bookValue, convertAmount, holdingPlDollars, holdingPlPct, marketValue, toCad, type FxRates,
} from '../../utils/investments/portfolioMetrics'
import { allocationPct } from '../../utils/investments/analysisMetrics'
import { formatMoney } from '../planner/format'
import { pct } from './holdingMetrics'
import { Skeleton } from '../ui/Skeleton'
import { ThemedSelect } from '../ui/ThemedSelect'

interface HoldingRowProps {
  holding: Holding
  rates: FxRates
  totalValueCad: number
  onPrice: (id: string, price: number, currency: Currency | null, unconvertible: boolean) => void
}

export const HoldingRow: React.FC<HoldingRowProps> = ({ holding, rates, totalValueCad, onPrice }) => {
  const setHoldingCurrency = usePortfolioStore((s) => s.setHoldingCurrency)
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
    onPrice(holding.id, price, quoteCurrency, priceUnconvertible) // parent keeps last-reported price; guarded upstream
  }, [holding.id, price, quoteCurrency, priceUnconvertible, onPrice])

  // price is only meaningful in the holding's own currency once the cross
  // rate resolves; when it does not, value, P/L and allocation are unknown,
  // not wrong-but-confident numbers computed from a mismatched price.
  const valueCad = priceUnconvertible ? null : toCad(marketValue(holding, price), holding.currency, rates)

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="py-2 pr-3">
        <span className="text-text-primary font-medium">{holding.ticker}</span>
        <span className="block text-[11px] text-text-secondary">
          <span className="inline-block align-middle">
            <ThemedSelect
              value={holding.currency ?? ''}
              onChange={(v) => setHoldingCurrency(holding.id, v ? (v as Currency) : null)}
              ariaLabel={`Currency for ${holding.ticker}`}
              className="!w-auto !px-1.5 !py-0 !text-[11px] !rounded"
              options={[
                { value: '', label: 'Set currency' },
                ...CURRENCIES.map((c) => ({ value: c, label: c })),
              ]}
            />
          </span>
          {priceUnconvertible && quoteCurrency ? (
            <span className="text-error" title={`Price quoted in ${quoteCurrency}, no rate into ${holding.currency ?? 'unset currency'}`}> · unconverted</span>
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
      <td data-testid="value-cell" className="py-2 pr-3 text-right text-text-primary">
        {priceUnconvertible ? '-' : formatMoney(marketValue(holding, price))}
      </td>
      <td
        data-testid="pl-cell"
        className={`py-2 pr-3 text-right ${
          priceUnconvertible ? 'text-text-secondary' : holdingPlDollars(holding, price) >= 0 ? 'text-accent' : 'text-error'
        }`}
      >
        {priceUnconvertible ? '-' : `${formatMoney(holdingPlDollars(holding, price))} (${pct(holdingPlPct(holding, price))})`}
      </td>
      <td data-testid="allocation-cell" className="py-2 text-right text-text-secondary">
        {valueCad === null ? '-' : pct(allocationPct(valueCad, totalValueCad))}
      </td>
    </tr>
  )
}
