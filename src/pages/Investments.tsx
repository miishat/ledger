import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, NotebookText, Upload } from 'lucide-react'
import { AnalysisCard } from '../components/investments/AnalysisCard'
import { AnalysisModal } from '../components/investments/AnalysisModal'
import { PortfolioView } from '../components/investments/PortfolioView'
import { TradesView } from '../components/investments/TradesView'
import { WheelView } from '../components/investments/wheel/WheelView'
import { useAnalysisStore } from '../store/useAnalysisStore'
import { useMarketDataStore } from '../store/useMarketDataStore'
import { usePortfolioStore } from '../store/usePortfolioStore'
import { quoteKey } from '../services/marketData'
import { currentValue, totalInvested } from '../utils/investments/analysisMetrics'
import { formatMoney } from '../components/planner/format'
import { Stat } from '../components/ui/Stat'
import { EmptyState } from '../components/ui/EmptyState'
import { Tabs, type TabItem } from '../components/ui/Tabs'
import { TabPanel } from '../components/ui/TabPanel'

type InvestTab = 'journal' | 'portfolio' | 'trades' | 'wheel'

const INVEST_TABS: readonly TabItem<InvestTab>[] = [
  { id: 'journal', label: 'Plan vs Actual' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'trades', label: 'Trades' },
  { id: 'wheel', label: 'Options' },
]

const isInvestTab = (v: string | null): v is InvestTab =>
  v === 'journal' || v === 'portfolio' || v === 'trades' || v === 'wheel'

const TAB_BLURBS: Record<string, string> = {
  journal: 'Your decision journal: what you analyzed, what you actually did, and how both performed.',
  portfolio: 'Your portfolio with live prices and allocations.',
  trades: 'Every buy and sell you have recorded, with realized gains and your adjusted cost base.',
  wheel: 'Wheel strategy: options premium, cost basis, and true breakeven per ticker.',
}

export const Investments: React.FC = () => {
  const analyses = useAnalysisStore((s) => s.analyses)
  const quotes = useMarketDataStore((s) => s.quotes)
  const overrides = useMarketDataStore((s) => s.overrides)
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Owned here rather than in PortfolioView because the trigger lives in this
  // page's header, in the slot the other tabs use for their action.
  const [importOpen, setImportOpen] = useState(false)
  const holdings = usePortfolioStore((s) => s.holdings)
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  // Landing on an empty "Plan vs Actual" while the Portfolio tab holds data
  // made the page look broken to anyone who imports holdings but keeps no
  // decision journal. Default to the first tab that actually has something.
  const defaultTab: InvestTab = analyses.length === 0 && holdings.length > 0 ? 'portfolio' : 'journal'
  const tab: InvestTab = isInvestTab(tabParam) ? tabParam : defaultTab
  const setTab = (next: InvestTab) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    setSearchParams(params)
  }

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
    <div className="flex flex-col gap-6 w-full min-h-full animate-fade-in">
      <header className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-[24px] font-semibold text-text-primary">Investments</h1>
          <p className="text-[14px] text-text-secondary mt-1">{TAB_BLURBS[tab]}</p>
        </div>
        {tab === 'journal' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> New Analysis
          </button>
        )}
        {/* Same slot and same treatment as New Analysis above. The two are
            mutually exclusive, one per tab, so a difference in size or fill
            between them would read as the header action changing shape as you
            move between tabs. */}
        {tab === 'portfolio' && (
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            <Upload className="w-4 h-4" aria-hidden="true" /> Import holdings
          </button>
        )}
      </header>

      <Tabs items={INVEST_TABS} value={tab} onChange={setTab} ariaLabel="Investments sections" />

      {tab === 'journal' && (
        <TabPanel id="journal" className="flex flex-col gap-6">
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
        </TabPanel>
      )}

      {tab === 'portfolio' && (
        <TabPanel id="portfolio">
          <PortfolioView importOpen={importOpen} onImportOpenChange={setImportOpen} />
        </TabPanel>
      )}

      {tab === 'trades' && (
        <TabPanel id="trades">
          <TradesView />
        </TabPanel>
      )}

      {tab === 'wheel' && (
        <TabPanel id="wheel">
          <WheelView />
        </TabPanel>
      )}
    </div>
  )
}
