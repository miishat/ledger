import React, { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { CompHeroWidget } from '../components/compensation/CompHeroWidget'
import { CompensationModal } from '../components/compensation/CompensationModal'
import { EquityVestingWidget } from '../components/compensation/EquityVestingWidget'
import { CompareView } from '../components/compensation/CompareView'
import { useCompensationStore, calcTotalComp, calcAnnualBaseSalary } from '../store/useCompensationStore'
import { useCompensationDisplay } from '../hooks/useCompensationDisplay'
import { NumberInput } from '../components/ui/NumberInput'
import { fxKey, todayKey } from '../services/marketData'
import { useMarketDataStore } from '../store/useMarketDataStore'

export const Compensation: React.FC = () => {
  const { setPrimaryPackage, compareMode, toggleCompareMode, timeMode, useCadConversion, toggleCadConversion } =
    useCompensationStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [manualPriceDraft, setManualPriceDraft] = useState(0)

  const {
    pkg,
    rawPrice,
    fxRate,
    fxStatus,
    fxAvailable,
    fxDate,
    fxSource,
    fxStale,
    priceStatus,
    priceSource,
    priceStale,
    refreshPrice,
    setManualPrice,
  } = useCompensationDisplay()

  const fxOverrideKey = fxKey('USD', 'CAD', todayKey())
  const fxOverride = useMarketDataStore((s) => s.overrides[fxOverrideKey])
  const setOverride = useMarketDataStore((s) => s.setOverride)
  const clearOverride = useMarketDataStore((s) => s.clearOverride)

  const totalComp = calcTotalComp(pkg, timeMode)
  const isPopulated = totalComp > 0

  const handleManualPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualPriceDraft > 0) {
      setManualPrice(manualPriceDraft)
      setManualPriceDraft(0)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full min-h-full p-6 animate-fade-in">
      <header className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[var(--color-text-primary)]">Compensation</h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            Analyze your base salary, bonuses, equity, and benefits to understand your true earning potential.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
        >
          {isPopulated ? 'Edit Package' : 'Add Compensation Package'}
        </button>
      </header>

      {isPopulated && (
        <div className="themed-card rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[13px] text-[var(--color-text-secondary)]">
              Stock price (USD): <span className="font-medium text-[var(--color-text-primary)]">${rawPrice.toFixed(2)}</span>
              {priceSource && <span className="ml-1 text-[11px] uppercase text-[var(--color-text-secondary)]">({priceSource}{priceStale ? ', stale' : ''})</span>}
            </span>
            <button
              type="button"
              onClick={() => refreshPrice(true)}
              aria-label="Refresh price"
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] transition-colors"
            >
              <RefreshCw size={14} className={priceStatus === 'loading' ? 'animate-spin' : ''} />
              Refresh Price
            </button>
            <form onSubmit={handleManualPriceSubmit} className="flex items-center gap-1">
              <NumberInput
                value={manualPriceDraft}
                onCommit={setManualPriceDraft}
                placeholder="Manual price"
                className="w-28 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md px-2 py-1 text-[12px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] transition-colors"
              >
                Set
              </button>
            </form>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={toggleCadConversion}
              aria-pressed={useCadConversion}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium border transition-colors ${
                useCadConversion
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] border-[var(--color-accent)]'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {useCadConversion
                ? fxAvailable
                  ? `Convert to CAD: ON (1 USD = ${fxRate.toFixed(4)} CAD${
                      fxSource === 'override' ? ', manual' : fxStale && fxDate ? `, as of ${fxDate}` : ''
                    }${fxStatus === 'loading' ? ', updating…' : ''})`
                  : 'Convert to CAD: ON (rate unavailable, set a manual rate)'
                : 'Convert to CAD: OFF'}
            </button>

            {useCadConversion && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-[12px] text-[var(--color-text-secondary)]">
                  Manual rate
                  <NumberInput
                    value={fxOverride ?? 0}
                    placeholder={fxAvailable ? fxRate.toFixed(4) : '1.3700'}
                    onCommit={(v) => { if (v > 0) setOverride(fxOverrideKey, v) }}
                    className="w-24 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md px-2 py-1 text-[12px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </label>
                {fxOverride !== undefined && (
                  <button
                    onClick={() => clearOverride(fxOverrideKey)}
                    className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    Use live
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CompHeroWidget className="h-full" />
        </div>

        <div className="themed-card rounded-xl p-6 flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Package Details</h2>
          {isPopulated ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                <span className="text-[14px] text-[var(--color-text-secondary)]">
                  Current Stock Price {useCadConversion ? '(CAD)' : '(USD)'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[14px] font-medium text-[var(--color-text-primary)]">$</span>
                  <NumberInput
                    value={pkg.companyCurrentPrice ?? 0}
                    onCommit={(n) => setPrimaryPackage({ companyCurrentPrice: n })}
                    maxDecimals={3}
                    disabled={useCadConversion}
                    className="w-24 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md px-2 py-1 text-[14px] font-medium text-[var(--color-text-primary)] text-right focus:border-[var(--color-accent)] focus:outline-none transition-colors disabled:opacity-60"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                <span className="text-[14px] text-[var(--color-text-secondary)]">
                  {timeMode === 'current-year' ? 'Blended Base Salary' : 'Current Base Salary'}
                </span>
                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  ${calcAnnualBaseSalary(pkg, timeMode).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                <span className="text-[14px] text-[var(--color-text-secondary)]">Target Bonus</span>
                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  {pkg.cashBonusPercent}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                <span className="text-[14px] text-[var(--color-text-secondary)]">RSU Grants</span>
                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  {pkg.rsuGrants.length} Active
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[14px] text-[var(--color-text-secondary)]">Benefits Match</span>
                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  {pkg.rrspMatchPercent}% RRSP, {pkg.esppContributionPercent}% ESPP
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <p className="text-[14px] text-[var(--color-text-secondary)] mb-4">
                No compensation data added yet. Start by adding your current offer or current package.
              </p>
            </div>
          )}
        </div>
      </div>

      {isPopulated && (
        <>
          <EquityVestingWidget />

          <div className="flex justify-end">
            <button
              id="compare-toggle-btn"
              onClick={toggleCompareMode}
              className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              Compare Another Offer
            </button>
          </div>

          {compareMode && <CompareView />}
        </>
      )}

      <CompensationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
