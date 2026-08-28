import React from 'react'
import type { Holding } from '../../store/usePortfolioStore'
import type { FxRates } from '../../utils/investments/portfolioMetrics'
import { portfolioHighlights } from '../../utils/investments/portfolioHighlights'
import { formatMoney } from '../planner/format'
import { pct } from './holdingMetrics'

interface PortfolioSummaryProps {
  rows: { holding: Holding; price: number }[]
  rates: FxRates
  /** Exactly the shape accountValue() in report/reportMetrics.ts returns. */
  nav: { nav: number; cash: number | null; baseCurrency: string } | null
  /** Retries the exchange rate fetch when holdings were excluded. */
  onRetryRates: () => void
}

interface Fact {
  label: string
  value: string
  /** Second line under the value, for the account value's cash sleeve. */
  sub?: string
  tone?: string
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ rows, rates, nav, onRetryRates }) => {
  const h = portfolioHighlights(rows, rates)
  const { totals } = h
  const up = totals.plCad >= 0

  const facts: Fact[] = [
    { label: 'Total invested', value: formatMoney(totals.investedCad) },
  ]
  // "Account Value" keeps its capital V: PortfolioView's existing report
  // tests assert on that exact string, and they are still correct tests.
  if (nav) {
    facts.push({
      label: `Account Value (${nav.baseCurrency})`,
      value: formatMoney(nav.nav),
      sub: nav.cash !== null ? `Cash ${formatMoney(nav.cash)}` : undefined,
    })
  }
  if (h.strongest) facts.push({ label: 'Strongest', value: `${h.strongest.ticker} ${pct(h.strongest.plPct)}`, tone: h.strongest.plPct >= 0 ? 'text-accent' : 'text-error' })
  if (h.weakest) facts.push({ label: 'Weakest', value: `${h.weakest.ticker} ${pct(h.weakest.plPct)}`, tone: h.weakest.plPct >= 0 ? 'text-accent' : 'text-error' })
  if (h.largestWeight) facts.push({ label: 'Largest weight', value: `${h.largestWeight.name} ${h.largestWeight.pct.toFixed(1)}%` })
  if (h.currencySplit.length > 0) {
    facts.push({
      label: 'Currency split',
      value: h.currencySplit.map((c) => `${c.name} ${c.pct.toFixed(1)}%`).join(' / '),
    })
  }
  facts.push({ label: 'Holdings', value: `${h.holdingCount} in ${h.accountCount} account${h.accountCount === 1 ? '' : 's'}` })

  return (
    <div className="themed-card rounded-lg p-5 desktop:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
        <div>
          <p className="text-[12px] uppercase text-text-secondary">Holdings Value (CAD)</p>
          <p className="text-[36px] desktop:text-[44px] font-semibold text-text-primary tabular-nums leading-none mt-2">
            {formatMoney(totals.valueCad)}
          </p>
          <p className={`text-[14px] font-medium tabular-nums mt-3 ${up ? 'text-accent' : 'text-error'}`}>
            <span aria-hidden="true">{up ? '▲' : '▼'}</span> {up ? '+' : ''}{formatMoney(totals.plCad)}
            {totals.plPct !== null ? ` · ${pct(totals.plPct)} all-time` : ''}
          </p>
          {totals.excludedCount > 0 && (
            <p className="text-[13px] text-error mt-2">
              {totals.excludedCount} holding{totals.excludedCount === 1 ? '' : 's'} left out of these totals: no exchange rate for {totals.excludedCount === 1 ? 'its' : 'their'} currency.{' '}
              <button
                type="button"
                onClick={onRetryRates}
                className="border control-border rounded px-1.5 py-0.5 text-[12px] hover:text-error/80 hover:border-error/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Retry exchange rates
              </button>
            </p>
          )}
        </div>
        <dl className="flex flex-col">
          {facts.map((f) => (
            <div key={f.label} className="flex justify-between items-baseline gap-4 py-2 border-b border-border last:border-b-0">
              <dt className="text-meta uppercase tracking-wide text-text-secondary">{f.label}</dt>
              <dd className="text-right">
                <span className={`block text-[13px] font-medium tabular-nums ${f.tone ?? 'text-text-primary'}`}>{f.value}</span>
                {f.sub && <span className="block text-meta text-text-secondary tabular-nums">{f.sub}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
