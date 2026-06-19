import { useState } from 'react'
import { X } from 'lucide-react'
import { useCompensationStore } from '../../store/useCompensationStore'
import type { VestingPreset, VestingFrequency } from '../../store/useCompensationStore'

interface CompensationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CompensationModal({ isOpen, onClose }: CompensationModalProps) {
  const { primaryPackage, setPrimaryPackage, addRSUGrant } = useCompensationStore()

  const [activeTab, setActiveTab] = useState<'base' | 'equity' | 'benefits'>('base')

  // Global Stock Price
  const [companyCurrentPrice, setCompanyCurrentPrice] = useState((primaryPackage.companyCurrentPrice || 100).toString())

  // Base & Cash
  const [baseSalary, setBaseSalary] = useState(primaryPackage.baseSalary.toString())
  const [cashBonusPercent, setCashBonusPercent] = useState(primaryPackage.cashBonusPercent.toString())
  const [cashBonusMonth, setCashBonusMonth] = useState((primaryPackage.cashBonusMonth || 12).toString())

  // Benefits
  const [esppContributionPercent, setEsppContributionPercent] = useState(primaryPackage.esppContributionPercent.toString())
  const [esppDiscountPercent, setEsppDiscountPercent] = useState(primaryPackage.esppDiscountPercent.toString() || '15')
  const [esppLockedInPrice, setEsppLockedInPrice] = useState((primaryPackage.esppLockedInPrice || 100).toString())
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

  if (!isOpen) return null

  const handleAddRSU = () => {
    if (!rsuGrantName || !rsuGrantShares) return

    let total = parseInt(rsuTotalMonths, 10)
    let cliff = parseInt(rsuCliffMonths, 10)
    let freq = rsuFrequency

    if (rsuPreset === '4yr-1yr-cliff') {
      total = 48
      cliff = 12
    } else if (rsuPreset === '3yr-no-cliff') {
      total = 36
      cliff = 0
    }

    addRSUGrant({
      id: crypto.randomUUID(),
      grantName: rsuGrantName,
      grantShares: Number(rsuGrantShares),
      grantPrice: Number(rsuGrantPrice) || 1,
      grantStartDate: rsuStartDate,
      vestingSchedule: {
        preset: rsuPreset,
        totalVestMonths: total,
        cliffMonths: cliff,
        frequency: freq,
      },
    })

    setRsuGrantName('')
    setRsuGrantShares('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setPrimaryPackage({
      companyCurrentPrice: Number(companyCurrentPrice) || 0,
      baseSalary: Number(baseSalary) || 0,
      cashBonusPercent: Number(cashBonusPercent) || 0,
      cashBonusMonth: Number(cashBonusMonth) || 12,
      esppContributionPercent: Number(esppContributionPercent) || 0,
      esppDiscountPercent: Number(esppDiscountPercent) || 15,
      esppLockedInPrice: Number(esppLockedInPrice) || 0,
      rrspMatchPercent: Number(rrspMatchPercent) || 0,
      rrspMatchCap: Number(rrspMatchCap) || 0,
    })

    onClose()
  }

  const inputClass = "w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
  const labelClass = "text-[12px] font-medium leading-none text-[var(--color-text-secondary)]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-[var(--color-bg-primary)] rounded-xl shadow-lg border border-[var(--color-border)] overflow-hidden max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-[18px] font-semibold leading-[1.2] text-[var(--color-text-primary)]">Edit Compensation Package</h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-[var(--color-border)] px-4 pt-2 gap-4">
          <button
            type="button"
            className={`pb-2 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'base' ? 'border-[var(--color-accent)] text-[var(--color-text-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            onClick={() => setActiveTab('base')}
          >
            Base & Cash
          </button>
          <button
            type="button"
            className={`pb-2 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'equity' ? 'border-[var(--color-accent)] text-[var(--color-text-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            onClick={() => setActiveTab('equity')}
          >
            Equity
          </button>
          <button
            type="button"
            className={`pb-2 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'benefits' ? 'border-[var(--color-accent)] text-[var(--color-text-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            onClick={() => setActiveTab('benefits')}
          >
            Benefits
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          {activeTab === 'base' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 border-b border-[var(--color-border)] pb-4 mb-2">
                <label className={labelClass}>Company Current Stock Price ($)</label>
                <input
                  type="number"
                  value={companyCurrentPrice}
                  onChange={(e) => setCompanyCurrentPrice(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelClass}>Base Salary ($)</label>
                <input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
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
                <select
                  value={cashBonusMonth}
                  onChange={(e) => setCashBonusMonth(e.target.value)}
                  className={inputClass}
                >
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
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
                    <select
                      value={rsuFrequency}
                      onChange={(e) => setRsuFrequency(e.target.value as VestingFrequency)}
                      className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md px-2 py-1 text-[12px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
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

              <button
                type="button"
                onClick={handleAddRSU}
                className="mt-2 w-full py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md text-[14px] font-medium hover:bg-[var(--color-bg-primary)] transition-colors"
              >
                Add RSU Grant
              </button>

              {primaryPackage.rsuGrants.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  <label className={labelClass}>Current Grants</label>
                  <div className="flex flex-col gap-2">
                    {primaryPackage.rsuGrants.map(g => {
                      const shares = g.grantShares || 0;
                      return (
                        <div key={g.id} className="flex justify-between items-center p-2 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border)]">
                          <span className="text-[14px]">{g.grantName} ({shares.toLocaleString()} shares)</span>
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
              className="w-full py-3 bg-[var(--color-accent)] text-white rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              Save Compensation Package
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
