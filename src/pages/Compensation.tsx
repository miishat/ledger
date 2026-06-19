import React, { useState } from 'react'
import { CompHeroWidget } from '../components/compensation/CompHeroWidget'
import { CompensationModal } from '../components/compensation/CompensationModal'
import { EquityVestingWidget } from '../components/compensation/EquityVestingWidget'
import { CompareView } from '../components/compensation/CompareView'
import { useCompensationStore, calcTotalComp } from '../store/useCompensationStore'

export const Compensation: React.FC = () => {
  const { primaryPackage, setPrimaryPackage, compareMode, toggleCompareMode } = useCompensationStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const totalComp = calcTotalComp(primaryPackage)
  const isPopulated = totalComp > 0

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-[24px] font-semibold text-[var(--color-text-primary)]">Total Compensation Calculator</h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
            Analyze your base salary, bonuses, equity, and benefits to understand your true earning potential.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
        >
          {isPopulated ? 'Edit Package' : 'Add Compensation Package'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CompHeroWidget className="h-full" />
        </div>
        
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Package Details</h2>
          {isPopulated ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                <span className="text-[14px] text-[var(--color-text-secondary)]">Current Stock Price</span>
                <div className="flex items-center gap-1">
                  <span className="text-[14px] font-medium text-[var(--color-text-primary)]">$</span>
                  <input
                    type="number"
                    value={primaryPackage.companyCurrentPrice || ''}
                    onChange={(e) => setPrimaryPackage({ companyCurrentPrice: Number(e.target.value) || 0 })}
                    className="w-20 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md px-2 py-1 text-[14px] font-medium text-[var(--color-text-primary)] text-right focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                <span className="text-[14px] text-[var(--color-text-secondary)]">Base Salary</span>
                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  ${primaryPackage.baseSalary.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                <span className="text-[14px] text-[var(--color-text-secondary)]">Target Bonus</span>
                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  {primaryPackage.cashBonusPercent}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
                <span className="text-[14px] text-[var(--color-text-secondary)]">RSU Grants</span>
                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  {primaryPackage.rsuGrants.length} Active
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[14px] text-[var(--color-text-secondary)]">Benefits Match</span>
                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  {primaryPackage.rrspMatchPercent}% RRSP, {primaryPackage.esppContributionPercent}% ESPP
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
              className="px-4 py-2 border border-[var(--color-border)] rounded-md text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors"
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
