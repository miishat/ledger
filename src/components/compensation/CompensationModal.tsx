import React, { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useCompensationStore } from '../../store/useCompensationStore'
import type { VestingPreset, VestingFrequency, PastSalary, VestingSchedule } from '../../store/useCompensationStore'
import { ThemedSelect } from '../ui/ThemedSelect'

const MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

interface CompensationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CompensationModal({ isOpen, onClose }: CompensationModalProps) {
  const { primaryPackage, setPrimaryPackage, addRSUGrant, updateRSUGrant } = useCompensationStore()

  const [activeTab, setActiveTab] = useState<'base' | 'equity' | 'benefits'>('base')

  // Global Stock Price
  const [companyCurrentPrice, setCompanyCurrentPrice] = useState((primaryPackage.companyCurrentPrice || 100).toString())
  const [companyTicker, setCompanyTicker] = useState(primaryPackage.companyTicker || '')

  // Base & Cash
  const [baseSalary, setBaseSalary] = useState(primaryPackage.baseSalary.toString())
  const [pastSalaryChanges, setPastSalaryChanges] = useState<PastSalary[]>(
    primaryPackage.pastSalaryChanges?.length > 0 
      ? primaryPackage.pastSalaryChanges 
      : [{ id: crypto.randomUUID(), salary: 0, changeMonth: 0 }]
  )
  const [cashBonusPercent, setCashBonusPercent] = useState(primaryPackage.cashBonusPercent.toString())
  const [cashBonusMonth, setCashBonusMonth] = useState((primaryPackage.cashBonusMonth || 12).toString())

  // Benefits
  const [esppContributionPercent, setEsppContributionPercent] = useState(primaryPackage.esppContributionPercent.toString())
  const [esppDiscountPercent, setEsppDiscountPercent] = useState(primaryPackage.esppDiscountPercent.toString() || '15')
  const [esppLockedInPrice, setEsppLockedInPrice] = useState((primaryPackage.esppLockedInPrice || 100).toString())
  const [esppLockInEndDate, setEsppLockInEndDate] = useState(primaryPackage.esppLockInEndDate || '')
  const [rrspMatchPercent, setRrspMatchPercent] = useState(primaryPackage.rrspMatchPercent.toString())
  const [rrspMatchCap, setRrspMatchCap] = useState(primaryPackage.rrspMatchCap.toString())

  // Equity (RSU)
  const [rsuGrantName, setRsuGrantName] = useState('')
  const [rsuGrantShares, setRsuGrantShares] = useState('')
  const [rsuGrantPrice, setRsuGrantPrice] = useState('100')
  const [rsuStartDate, setRsuStartDate] = useState(new Date().toISOString().split('T')[0])
  const [rsuPreset, setRsuPreset] = useState<VestingPreset>('4yr-1yr-cliff')
  const [rsuTotalMonths, setRsuTotalMonths] = useState('48')
  const [rsuCliffMonths, setRsuCliffMonths] = useState('12')
  const [rsuFrequency, setRsuFrequency] = useState<VestingFrequency>('monthly')
  const [editRsuGrantId, setEditRsuGrantId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSaveRSU = () => {
    if (!rsuGrantName || !rsuGrantShares || !rsuGrantPrice) return

    const schedule: VestingSchedule = {
      preset: rsuPreset,
      totalVestMonths: rsuPreset === 'custom' ? Number(rsuTotalMonths) : (rsuPreset === '4yr-1yr-cliff' ? 48 : 36),
      cliffMonths: rsuPreset === 'custom' ? Number(rsuCliffMonths) : (rsuPreset === '4yr-1yr-cliff' ? 12 : 0),
      frequency: rsuFrequency
    }

    if (editRsuGrantId) {
      updateRSUGrant(editRsuGrantId, {
        grantName: rsuGrantName,
        grantShares: Number(rsuGrantShares),
        grantPrice: Number(rsuGrantPrice),
        grantStartDate: rsuStartDate,
        vestingSchedule: schedule
      })
      setEditRsuGrantId(null)
    } else {
      addRSUGrant({
        id: crypto.randomUUID(),
        grantName: rsuGrantName,
        grantShares: Number(rsuGrantShares),
        grantPrice: Number(rsuGrantPrice),
        grantStartDate: rsuStartDate,
        vestingSchedule: schedule
      })
    }

    setRsuGrantName('')
    setRsuGrantShares('')
  }

  const handleEditRSU = (grant: any) => {
    setEditRsuGrantId(grant.id)
    setRsuGrantName(grant.grantName)
    setRsuGrantShares(grant.grantShares.toString())
    setRsuGrantPrice(grant.grantPrice.toString())
    setRsuStartDate(grant.grantStartDate || new Date().toISOString().split('T')[0])
    setRsuPreset(grant.vestingSchedule.preset)
    setRsuTotalMonths(grant.vestingSchedule.totalVestMonths.toString())
    setRsuCliffMonths(grant.vestingSchedule.cliffMonths.toString())
    setRsuFrequency(grant.vestingSchedule.frequency)
  }

  const handleCancelEditRSU = () => {
    setEditRsuGrantId(null)
    setRsuGrantName('')
    setRsuGrantShares('')
  }

  const addPastSalaryChange = () => {
    setPastSalaryChanges(prev => [...prev, { id: crypto.randomUUID(), salary: 0, changeMonth: 0 }])
  }

  const removePastSalaryChange = (id: string) => {
    setPastSalaryChanges(prev => prev.filter(p => p.id !== id))
  }

  const handlePastSalaryChange = (id: string, field: 'salary' | 'changeMonth', value: string) => {
    setPastSalaryChanges(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: Number(value) || 0 }
      }
      return p
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setPrimaryPackage({
      companyTicker: companyTicker.trim().toUpperCase(),
      companyCurrentPrice: Number(companyCurrentPrice) || 0,
      baseSalary: Number(baseSalary) || 0,
      pastSalaryChanges: pastSalaryChanges.filter(c => c.salary > 0 && c.changeMonth > 0),
      cashBonusPercent: Number(cashBonusPercent) || 0,
      cashBonusMonth: Number(cashBonusMonth) || 12,
      esppContributionPercent: Number(esppContributionPercent) || 0,
      esppDiscountPercent: esppDiscountPercent === '' ? 15 : Number(esppDiscountPercent),
      esppLockedInPrice: Number(esppLockedInPrice) || 0,
      esppLockInEndDate: esppLockInEndDate,
      rrspMatchPercent: Number(rrspMatchPercent) || 0,
      rrspMatchCap: Number(rrspMatchCap) || 0,
    })

    onClose()
  }

  const inputClass = "w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
  const labelClass = "text-[12px] font-medium leading-none text-[var(--color-text-secondary)]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit Compensation Package">
      <div className="w-full max-w-2xl bg-[var(--color-bg-primary)] rounded-xl shadow-lg border border-[var(--color-border)] overflow-hidden max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-[18px] font-semibold leading-[1.2] text-[var(--color-text-primary)]">Edit Compensation Package</h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-[var(--color-border)] flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass} htmlFor="company-ticker-input">Ticker (optional, for live price)</label>
            <input
              id="company-ticker-input"
              type="text"
              value={companyTicker}
              onChange={(e) => setCompanyTicker(e.target.value)}
              placeholder="e.g. AAPL"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Company Current Stock Price ($)</label>
            <input
              type="number"
              value={companyCurrentPrice}
              onChange={(e) => setCompanyCurrentPrice(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]">
          <div className="flex p-1 bg-[var(--color-border)] rounded-lg gap-1">
            <button
              type="button"
              className={`flex-1 py-1.5 text-[14px] font-medium rounded-md transition-all ${activeTab === 'base' ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              onClick={() => setActiveTab('base')}
            >
              Base & Cash
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-[14px] font-medium rounded-md transition-all ${activeTab === 'equity' ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              onClick={() => setActiveTab('equity')}
            >
              Equity
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-[14px] font-medium rounded-md transition-all ${activeTab === 'benefits' ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              onClick={() => setActiveTab('benefits')}
            >
              Benefits
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          {activeTab === 'base' && (
            <div className="flex flex-col gap-4">

              <div className="flex flex-col gap-2">
                <label className={labelClass}>Current Base Salary ($)</label>
                <input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className={labelClass}>Past Salary Changes</label>
                  <button
                    type="button"
                    onClick={addPastSalaryChange}
                    className="flex items-center gap-1 text-[13px] text-[var(--color-accent)] hover:opacity-80 transition-opacity"
                  >
                    <Plus size={14} /> Add Change
                  </button>
                </div>
                {pastSalaryChanges.map((change) => (
                  <div key={change.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end bg-[var(--color-bg-secondary)] p-3 rounded-lg border border-[var(--color-border)]">
                    <div className="flex flex-col gap-2">
                      <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">Previous Salary ($)</label>
                      <input
                        type="number"
                        value={change.salary || ''}
                        onChange={(e) => handlePastSalaryChange(change.id, 'salary', e.target.value)}
                        placeholder="Optional"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">Change Month</label>
                      <ThemedSelect
                        value={String(change.changeMonth ?? '')}
                        onChange={(v) => handlePastSalaryChange(change.id, 'changeMonth', v)}
                        options={[{ value: '', label: 'None' }, ...MONTH_OPTIONS]}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePastSalaryChange(change.id)}
                      className="p-2 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors h-[38px] flex items-center justify-center border border-[var(--color-border)] rounded-md bg-[var(--color-bg-primary)]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
                <label className={labelClass}>Cash Bonus (%)</label>
                <input
                  type="number"
                  value={cashBonusPercent}
                  onChange={(e) => setCashBonusPercent(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Bonus Payout Month</label>
                <ThemedSelect
                  value={cashBonusMonth}
                  onChange={(v) => setCashBonusMonth(v)}
                  options={MONTH_OPTIONS}
                />
              </div>
            </div>
          )}

          {activeTab === 'equity' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>RSU Grant Name</label>
                <input
                  type="text"
                  value={rsuGrantName}
                  onChange={(e) => setRsuGrantName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Number of Shares</label>
                <input
                  type="number"
                  value={rsuGrantShares}
                  onChange={(e) => setRsuGrantShares(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Grant Price ($)</label>
                  <input
                    type="number"
                    value={rsuGrantPrice}
                    onChange={(e) => setRsuGrantPrice(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Grant Start Date</label>
                  <input
                    type="date"
                    value={rsuStartDate}
                    onChange={(e) => setRsuStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-center">
                  <label className={labelClass}>Vesting Schedule</label>
                  <div className="flex items-center gap-2">
                    <label className={labelClass}>Frequency:</label>
                    <ThemedSelect
                      value={rsuFrequency}
                      onChange={(v) => setRsuFrequency(v as VestingFrequency)}
                      className="text-[12px]"
                      options={[
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'quarterly', label: 'Quarterly' },
                      ]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRsuPreset('4yr-1yr-cliff')}
                    className={`min-h-[44px] px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${rsuPreset === '4yr-1yr-cliff' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                  >
                    4-Year with 1-Year Cliff
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsuPreset('3yr-no-cliff')}
                    className={`min-h-[44px] px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${rsuPreset === '3yr-no-cliff' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                  >
                    3-Year, No Cliff
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsuPreset('custom')}
                    className={`min-h-[44px] px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${rsuPreset === 'custom' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                  >
                    Custom Schedule
                  </button>
                </div>
              </div>

              {rsuPreset === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Total Vest (months)</label>
                    <input
                      type="number"
                      value={rsuTotalMonths}
                      onChange={(e) => setRsuTotalMonths(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Cliff (months)</label>
                    <input
                      type="number"
                      value={rsuCliffMonths}
                      onChange={(e) => setRsuCliffMonths(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleSaveRSU}
                  className="flex-1 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md text-[14px] font-medium hover:bg-[var(--color-bg-primary)] transition-colors"
                >
                  {editRsuGrantId ? 'Update RSU Grant' : 'Add RSU Grant'}
                </button>
                {editRsuGrantId && (
                  <button
                    type="button"
                    onClick={handleCancelEditRSU}
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md text-[14px] font-medium hover:bg-red-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {primaryPackage.rsuGrants.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  <label className={labelClass}>Current Grants</label>
                  <div className="flex flex-col gap-2">
                    {primaryPackage.rsuGrants.map(g => {
                      const shares = g.grantShares || 0;
                      return (
                        <div key={g.id} className="flex justify-between items-center p-2 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border)]">
                          <span className="text-[14px]">{g.grantName} ({shares.toLocaleString()} shares)</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditRSU(g)}
                              className="text-[12px] text-[var(--color-accent)] hover:opacity-80 transition-opacity"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => useCompensationStore.getState().removeRSUGrant(g.id)}
                              className="text-[12px] text-red-500 hover:opacity-80 transition-opacity"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'benefits' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>ESPP Contribution (%)</label>
                  <input
                    type="number"
                    value={esppContributionPercent}
                    onChange={(e) => setEsppContributionPercent(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>ESPP Discount (%)</label>
                  <input
                    type="number"
                    value={esppDiscountPercent}
                    onChange={(e) => setEsppDiscountPercent(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>ESPP Lock-In Price ($)</label>
                  <input
                    type="number"
                    value={esppLockedInPrice}
                    onChange={(e) => setEsppLockedInPrice(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Lock-In End Date (Optional)</label>
                  <input
                    type="date"
                    value={esppLockInEndDate}
                    onChange={(e) => setEsppLockInEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>RRSP Match (%)</label>
                <input
                  type="number"
                  value={rrspMatchPercent}
                  onChange={(e) => setRrspMatchPercent(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>RRSP Match Cap ($)</label>
                <input
                  type="number"
                  value={rrspMatchCap}
                  onChange={(e) => setRrspMatchCap(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div className="pt-2 mt-2 border-t border-[var(--color-border)]">
            <button
              type="submit"
              className="w-full py-3 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              Save Compensation Package
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
