import React from 'react'
import { Link } from 'react-router-dom'
import { WidgetWrapper } from '../WidgetWrapper'
import { usePortfolioStore } from '../../../store/usePortfolioStore'
import { useMarketDataStore } from '../../../store/useMarketDataStore'
import { quoteKey, useFxRate } from '../../../services/marketData'
import { portfolioTotals } from '../../../utils/investments/portfolioMetrics'
import { formatMoney } from '../../planner/format'

export const PortfolioRollupWidget: React.FC = () => {
  const holdings = usePortfolioStore((s) => s.holdings)
  const quotes = useMarketDataStore((s) => s.quotes)
  const overrides = useMarketDataStore((s) => s.overrides)
  const fx = useFxRate('USD', 'CAD')

  if (holdings.length === 0) {
    return (
      <WidgetWrapper title="Portfolio">
        <p className="text-[13px] text-text-secondary mt-2">
          <Link to="/investments" className="text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded">Import a broker CSV</Link> to see your portfolio value here.
        </p>
      </WidgetWrapper>
    )
  }

  // Rollup uses override > cached > avgCost prices (the Investments page fetches live).
  const rows = holdings.map((h) => ({
    holding: h,
    price: overrides[quoteKey(h.ticker, h.exchange)] ?? quotes[quoteKey(h.ticker, h.exchange)]?.value.price ?? h.avgCost,
  }))
  const t = portfolioTotals(rows, fx.data?.value.rate ?? 1)

  return (
    <WidgetWrapper title="Portfolio">
      <div className="flex flex-col gap-1 mt-2">
        <span className="text-[28px] font-bold text-accent">{formatMoney(t.valueCad)}</span>
        <span className={`text-[13px] ${t.plCad >= 0 ? 'text-accent' : 'text-error'}`}>
          {t.plCad >= 0 ? '+' : ''}{formatMoney(t.plCad)}{t.plPct !== null ? ` (${t.plPct.toFixed(1)}%)` : ''} all-time
        </span>
        <span className="text-[12px] text-text-secondary">{holdings.length} holdings · CAD</span>
      </div>
    </WidgetWrapper>
  )
}
