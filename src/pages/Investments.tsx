import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { AnalysisCard } from '../components/investments/AnalysisCard'
import { AnalysisModal } from '../components/investments/AnalysisModal'
import { PortfolioView } from '../components/investments/PortfolioView'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useMarketDataStore } from '../store/useMarketDataStore'
import { quoteKey } from '../services/marketData'
import { currentValue, totalInvested } from '../utils/investments/analysisMetrics'
import { formatMoney } from '../components/planner/format'

export const Investments: React.FC = () => {
  const analyses = useAnalysisStore((s) => s.analyses)
  const quotes = useMarketDataStore((s) => s.quotes)
  const overrides = useMarketDataStore((s) => s.overrides)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tab, setTab] = useState<'journal' | 'portfolio'>('journal')

  // Header totals use override > cached > start price (cards fetch live).
  const priceFor = (ticker: string, exchange: string | undefined, fallback: number) =>
    overrides[quoteKey(ticker, exchange)] ?? quotes[quoteKey(ticker, exchange)]?.value.price ?? fallback

  const plannedAll = analyses.reduce((s, a) => s + a.plannedAmount, 0)
  const investedAll = analyses.reduce((s, a) => s + totalInvested(a.lots), 0)
  const currentAll = analyses.reduce(
    (s, a) => s + currentValue(a.lots, priceFor(a.ticker, a.exchange, a.startPrice)),
    0,
  )

  return (
    <div className="flex flex-col gap-6 w-full min-h-full p-6 animate-fade-in">
      <header className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-[24px] font-semibold text-text-primary">Investments</h1>
          <p className="text-[14px] text-text-secondary mt-1">
            {tab === 'journal' ? 'Your decision journal: what you analyzed, what you actually did, and how both performed.' : 'Your portfolio with live prices and allocations.'}
          </p>
        </div>
        {tab === 'journal' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> New analysis
          </button>
        )}
      </header>

      <div className="flex gap-2">
        {(['journal', 'portfolio'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${
              tab === t ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {t === 'journal' ? 'Plan vs Actual' : 'Portfolio'}
          </button>
        ))}
      </div>

      {tab === 'journal' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="themed-card rounded-lg p-4"><p className="text-[12px] uppercase text-text-secondary">Total planned</p><p className="text-[22px] font-semibold text-text-primary">{formatMoney(plannedAll)}</p></div>
            <div className="themed-card rounded-lg p-4"><p className="text-[12px] uppercase text-text-secondary">Actually invested</p><p className="text-[22px] font-semibold text-text-primary">{formatMoney(investedAll)} <span className="text-[13px] text-text-secondary">({formatMoney(investedAll - plannedAll)} vs plan)</span></p></div>
            <div className="themed-card rounded-lg p-4"><p className="text-[12px] uppercase text-text-secondary">Current value</p><p className="text-[22px] font-semibold text-accent">{formatMoney(currentAll)}</p></div>
          </div>

          {analyses.length === 0 ? (
            <div className="themed-card rounded-lg p-10 flex flex-col items-center gap-2">
              <p className="text-text-primary text-[16px] font-medium">No analyses yet</p>
              <p className="text-text-secondary text-[14px]">Record your first investment thesis — the start price auto-fills from the analysis date.</p>
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
      ) : (
        <PortfolioView />
      )}
    </div>
  )
}
