import React, { useState } from 'react'
import { Plus, NotebookText } from 'lucide-react'
import { AnalysisCard } from '../components/investments/AnalysisCard'
import { AnalysisModal } from '../components/investments/AnalysisModal'
import { PortfolioView } from '../components/investments/PortfolioView'
import { WheelView } from '../components/investments/wheel/WheelView'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useMarketDataStore } from '../store/useMarketDataStore'
import { quoteKey } from '../services/marketData'
import { currentValue, totalInvested } from '../utils/investments/analysisMetrics'
import { formatMoney } from '../components/planner/format'
import { Stat } from '../components/ui/Stat'
import { EmptyState } from '../components/ui/EmptyState'

export const Investments: React.FC = () => {
  const analyses = useAnalysisStore((s) => s.analyses)
  const quotes = useMarketDataStore((s) => s.quotes)
  const overrides = useMarketDataStore((s) => s.overrides)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tab, setTab] = useState<'journal' | 'portfolio' | 'wheel'>('journal')

  // Header totals use override > cached > start price (cards fetch live).
  const priceFor = (ticker: string, exchange: string | undefined, fallback: number) =>
    overrides[quoteKey(ticker, exchange)] ?? quotes[quoteKey(ticker, exchange)]?.value.price ?? fallback

  const positionsAll = analyses.flatMap((a) => a.positions)
  const plannedAll = analyses.reduce((s, a) => s + (a.plannedBudget ?? 0), 0)
  const investedAll = positionsAll.reduce((s, p) => s + totalInvested(p.lots), 0)
  const currentAll = positionsAll.reduce(
    (s, p) => s + currentValue(p.lots, priceFor(p.ticker, p.exchange, p.startPrice)),
    0,
  )

  return (
    <div className="flex flex-col gap-6 w-full min-h-full p-6 animate-fade-in">
      <header className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-[24px] font-semibold text-text-primary">Investments</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            {tab === 'journal'
              ? 'Your decision journal: what you analyzed, what you actually did, and how both performed.'
              : tab === 'portfolio'
                ? 'Your portfolio with live prices and allocations.'
                : 'Wheel strategy: options premium, cost basis, and true breakeven per ticker.'}
          </p>
        </div>
        {tab === 'journal' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> New Analysis
          </button>
        )}
      </header>

      <div className="flex gap-2">
        {(['journal', 'portfolio', 'wheel'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${
              tab === t ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {t === 'journal' ? 'Plan vs Actual' : t === 'portfolio' ? 'Portfolio' : 'Options'}
          </button>
        ))}
      </div>

      {tab === 'journal' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="themed-card rounded-lg p-4">
              <Stat label="Total Planned" value={formatMoney(plannedAll)} />
            </div>
            <div className="themed-card rounded-lg p-4">
              <Stat label="Actually Invested" value={formatMoney(investedAll)} sub={`${formatMoney(investedAll - plannedAll)} vs plan`} />
            </div>
            <div className="themed-card rounded-lg p-4">
              <Stat label="Current Value" value={formatMoney(currentAll)} tone="accent" />
            </div>
          </div>

          {analyses.length === 0 ? (
            <div className="themed-card rounded-lg p-10">
              <EmptyState
                icon={NotebookText}
                message="No analyses yet"
                hint="Record your first investment thesis. The start price auto-fills from the analysis date."
                action={{ label: 'New Analysis', onClick: () => setIsModalOpen(true) }}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {analyses.map((a) => (
                <AnalysisCard key={a.id} analysis={a} totals={{ plannedAll, currentAll }} />
              ))}
            </div>
          )}

          <AnalysisModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
      ) : tab === 'portfolio' ? (
        <PortfolioView />
      ) : (
        <WheelView />
      )}
    </div>
  )
}
