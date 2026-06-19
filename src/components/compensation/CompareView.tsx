import { useState } from 'react'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { 
  useCompensationStore, 
  calcTotalComp, 
  calcAnnualBonus, 
  calcAnnualESPP, 
  calcAnnualRRSP, 
  calcAnnualRSU 
} from '../../store/useCompensationStore'

export function CompareView() {
  const { primaryPackage, comparePackage, setComparePackage } = useCompensationStore()

  const [compareName] = useState('Compare Offer')
  const [compareBaseSalary, setCompareBaseSalary] = useState('')
  const [compareCompanyCurrentPrice, setCompareCompanyCurrentPrice] = useState('100')
  const [compareCashBonusPercent, setCompareCashBonusPercent] = useState('0')
  const [compareCashBonusMonth, setCompareCashBonusMonth] = useState('12')
  const [compareEsppContributionPercent, setCompareEsppContributionPercent] = useState('0')
  const [compareEsppDiscountPercent, setCompareEsppDiscountPercent] = useState('15')
  const [compareEsppLockedInPrice, setCompareEsppLockedInPrice] = useState('100')
  const [compareRrspMatchPercent, setCompareRrspMatchPercent] = useState('0')
  const [compareRrspMatchCap, setCompareRrspMatchCap] = useState('0')

  const handleCalculate = () => {
    setComparePackage({
      id: 'compare',
      name: compareName,
      companyCurrentPrice: Number(compareCompanyCurrentPrice) || 0,
      baseSalary: Number(compareBaseSalary) || 0,
      cashBonusPercent: Number(compareCashBonusPercent) || 0,
      cashBonusMonth: Number(compareCashBonusMonth) || 12,
      esppContributionPercent: Number(compareEsppContributionPercent) || 0,
      esppDiscountPercent: Number(compareEsppDiscountPercent) || 0,
      esppLockedInPrice: Number(compareEsppLockedInPrice) || 0,
      rrspMatchPercent: Number(compareRrspMatchPercent) || 0,
      rrspMatchCap: Number(compareRrspMatchCap) || 0,
      rsuGrants: []
    })
  }

  const inputClass = "w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
  const labelClass = "text-[12px] font-medium leading-none text-[var(--color-text-secondary)]"




  return (
    <WidgetWrapper title="Offer Comparison">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Input Form */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <h3 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Compare Another Offer</h3>
          
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 border-b border-[var(--color-border)] pb-3 mb-1">
              <label className={labelClass}>Company Stock Price ($)</label>
              <input type="number" value={compareCompanyCurrentPrice} onChange={(e) => setCompareCompanyCurrentPrice(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>Base Salary ($)</label>
              <input type="number" value={compareBaseSalary} onChange={(e) => setCompareBaseSalary(e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Cash Bonus (%)</label>
                <input type="number" value={compareCashBonusPercent} onChange={(e) => setCompareCashBonusPercent(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Bonus Month</label>
                <select value={compareCashBonusMonth} onChange={(e) => setCompareCashBonusMonth(e.target.value)} className={inputClass}>
                  <option value="1">Jan</option>
                  <option value="2">Feb</option>
                  <option value="3">Mar</option>
                  <option value="4">Apr</option>
                  <option value="5">May</option>
                  <option value="6">Jun</option>
                  <option value="7">Jul</option>
                  <option value="8">Aug</option>
                  <option value="9">Sep</option>
                  <option value="10">Oct</option>
                  <option value="11">Nov</option>
                  <option value="12">Dec</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>ESPP (%)</label>
                <input type="number" value={compareEsppContributionPercent} onChange={(e) => setCompareEsppContributionPercent(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Discount (%)</label>
                <input type="number" value={compareEsppDiscountPercent} onChange={(e) => setCompareEsppDiscountPercent(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>ESPP Lock-In Price ($)</label>
              <input type="number" value={compareEsppLockedInPrice} onChange={(e) => setCompareEsppLockedInPrice(e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>RRSP Match (%)</label>
                <input type="number" value={compareRrspMatchPercent} onChange={(e) => setCompareRrspMatchPercent(e.target.value)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Match Cap ($)</label>
                <input type="number" value={compareRrspMatchCap} onChange={(e) => setCompareRrspMatchCap(e.target.value)} className={inputClass} />
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="mt-2 w-full py-2 bg-[var(--color-accent)] text-white rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              Calculate Comparison
            </button>
          </div>
        </div>

        {/* Delta List */}
        {comparePackage && (
          <div className="w-full lg:w-2/3 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-[var(--color-border)] pt-4 lg:pt-0 lg:pl-8">
            <h3 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Offer Comparison</h3>
            
            <div className="flex flex-col w-full">
              <div className="flex justify-between items-center py-2 border-b-2 border-[var(--color-border)] mb-2">
                <div className="w-1/4"></div>
                <div className="w-1/4 text-center">
                  <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">Current Offer</span>
                </div>
                <div className="w-1/4 text-center">
                  <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">Compare Offer</span>
                </div>
                <div className="w-1/4 text-right">
                  <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">Delta</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-[var(--color-border)]">
                <div className="w-1/4"><span className="text-[14px] text-[var(--color-text-secondary)]">Base Salary</span></div>
                <div className="w-1/4 text-center"><span className="text-[14px] text-[var(--color-text-primary)]">${primaryPackage.baseSalary.toLocaleString()}</span></div>
                <div className="w-1/4 text-center"><span className="text-[14px] text-[var(--color-text-primary)]">${comparePackage.baseSalary.toLocaleString()}</span></div>
                <div className="w-1/4 flex justify-end">
                  <span className={comparePackage.baseSalary - primaryPackage.baseSalary > 0 ? "text-green-600 bg-green-50 px-2 py-0.5 rounded text-[12px] font-medium" : comparePackage.baseSalary - primaryPackage.baseSalary < 0 ? "text-red-500 bg-red-50 px-2 py-0.5 rounded text-[12px] font-medium" : "text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-0.5 rounded text-[12px] font-medium"}>
                    {comparePackage.baseSalary - primaryPackage.baseSalary > 0 ? `+$${Math.abs(comparePackage.baseSalary - primaryPackage.baseSalary).toLocaleString()} more` : comparePackage.baseSalary - primaryPackage.baseSalary < 0 ? `−$${Math.abs(comparePackage.baseSalary - primaryPackage.baseSalary).toLocaleString()} less` : "Equivalent"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-[var(--color-border)]">
                <div className="w-1/4"><span className="text-[14px] text-[var(--color-text-secondary)]">Annual Bonus</span></div>
                <div className="w-1/4 text-center"><span className="text-[14px] text-[var(--color-text-primary)]">${calcAnnualBonus(primaryPackage).toLocaleString()}</span></div>
                <div className="w-1/4 text-center"><span className="text-[14px] text-[var(--color-text-primary)]">${calcAnnualBonus(comparePackage).toLocaleString()}</span></div>
                <div className="w-1/4 flex justify-end">
                  <span className={calcAnnualBonus(comparePackage) - calcAnnualBonus(primaryPackage) > 0 ? "text-green-600 bg-green-50 px-2 py-0.5 rounded text-[12px] font-medium" : calcAnnualBonus(comparePackage) - calcAnnualBonus(primaryPackage) < 0 ? "text-red-500 bg-red-50 px-2 py-0.5 rounded text-[12px] font-medium" : "text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-0.5 rounded text-[12px] font-medium"}>
                    {calcAnnualBonus(comparePackage) - calcAnnualBonus(primaryPackage) > 0 ? `+$${Math.abs(calcAnnualBonus(comparePackage) - calcAnnualBonus(primaryPackage)).toLocaleString()} more` : calcAnnualBonus(comparePackage) - calcAnnualBonus(primaryPackage) < 0 ? `−$${Math.abs(calcAnnualBonus(comparePackage) - calcAnnualBonus(primaryPackage)).toLocaleString()} less` : "Equivalent"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-[var(--color-border)]">
                <div className="w-1/4"><span className="text-[14px] text-[var(--color-text-secondary)]">ESPP Benefit</span></div>
                <div className="w-1/4 text-center"><span className="text-[14px] text-[var(--color-text-primary)]">${calcAnnualESPP(primaryPackage).toLocaleString()}</span></div>
                <div className="w-1/4 text-center"><span className="text-[14px] text-[var(--color-text-primary)]">${calcAnnualESPP(comparePackage).toLocaleString()}</span></div>
                <div className="w-1/4 flex justify-end">
                  <span className={calcAnnualESPP(comparePackage) - calcAnnualESPP(primaryPackage) > 0 ? "text-green-600 bg-green-50 px-2 py-0.5 rounded text-[12px] font-medium" : calcAnnualESPP(comparePackage) - calcAnnualESPP(primaryPackage) < 0 ? "text-red-500 bg-red-50 px-2 py-0.5 rounded text-[12px] font-medium" : "text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-0.5 rounded text-[12px] font-medium"}>
                    {calcAnnualESPP(comparePackage) - calcAnnualESPP(primaryPackage) > 0 ? `+$${Math.abs(calcAnnualESPP(comparePackage) - calcAnnualESPP(primaryPackage)).toLocaleString()} more` : calcAnnualESPP(comparePackage) - calcAnnualESPP(primaryPackage) < 0 ? `−$${Math.abs(calcAnnualESPP(comparePackage) - calcAnnualESPP(primaryPackage)).toLocaleString()} less` : "Equivalent"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-[var(--color-border)]">
                <div className="w-1/4"><span className="text-[14px] text-[var(--color-text-secondary)]">RRSP Match</span></div>
                <div className="w-1/4 text-center"><span className="text-[14px] text-[var(--color-text-primary)]">${calcAnnualRRSP(primaryPackage).toLocaleString()}</span></div>
                <div className="w-1/4 text-center"><span className="text-[14px] text-[var(--color-text-primary)]">${calcAnnualRRSP(comparePackage).toLocaleString()}</span></div>
                <div className="w-1/4 flex justify-end">
                  <span className={calcAnnualRRSP(comparePackage) - calcAnnualRRSP(primaryPackage) > 0 ? "text-green-600 bg-green-50 px-2 py-0.5 rounded text-[12px] font-medium" : calcAnnualRRSP(comparePackage) - calcAnnualRRSP(primaryPackage) < 0 ? "text-red-500 bg-red-50 px-2 py-0.5 rounded text-[12px] font-medium" : "text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-0.5 rounded text-[12px] font-medium"}>
                    {calcAnnualRRSP(comparePackage) - calcAnnualRRSP(primaryPackage) > 0 ? `+$${Math.abs(calcAnnualRRSP(comparePackage) - calcAnnualRRSP(primaryPackage)).toLocaleString()} more` : calcAnnualRRSP(comparePackage) - calcAnnualRRSP(primaryPackage) < 0 ? `−$${Math.abs(calcAnnualRRSP(comparePackage) - calcAnnualRRSP(primaryPackage)).toLocaleString()} less` : "Equivalent"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-[var(--color-border)]">
                <div className="w-1/4"><span className="text-[14px] text-[var(--color-text-secondary)]">RSU (Annual)</span></div>
                <div className="w-1/4 text-center"><span className="text-[14px] text-[var(--color-text-primary)]">${calcAnnualRSU(primaryPackage).toLocaleString()}</span></div>
                <div className="w-1/4 text-center"><span className="text-[14px] text-[var(--color-text-primary)]">${calcAnnualRSU(comparePackage).toLocaleString()}</span></div>
                <div className="w-1/4 flex justify-end">
                  <span className={calcAnnualRSU(comparePackage) - calcAnnualRSU(primaryPackage) > 0 ? "text-green-600 bg-green-50 px-2 py-0.5 rounded text-[12px] font-medium" : calcAnnualRSU(comparePackage) - calcAnnualRSU(primaryPackage) < 0 ? "text-red-500 bg-red-50 px-2 py-0.5 rounded text-[12px] font-medium" : "text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-0.5 rounded text-[12px] font-medium"}>
                    {calcAnnualRSU(comparePackage) - calcAnnualRSU(primaryPackage) > 0 ? `+$${Math.abs(calcAnnualRSU(comparePackage) - calcAnnualRSU(primaryPackage)).toLocaleString()} more` : calcAnnualRSU(comparePackage) - calcAnnualRSU(primaryPackage) < 0 ? `−$${Math.abs(calcAnnualRSU(comparePackage) - calcAnnualRSU(primaryPackage)).toLocaleString()} less` : "Equivalent"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3">
                <div className="w-1/4"><span className="text-[14px] font-semibold text-[var(--color-text-primary)]">Total Compensation</span></div>
                <div className="w-1/4 text-center"><span className="text-[14px] font-bold text-[var(--color-text-primary)]">${calcTotalComp(primaryPackage).toLocaleString()}</span></div>
                <div className="w-1/4 text-center"><span className="text-[14px] font-bold text-[var(--color-text-primary)]">${calcTotalComp(comparePackage).toLocaleString()}</span></div>
                <div className="w-1/4 flex justify-end">
                  <span className={calcTotalComp(comparePackage) - calcTotalComp(primaryPackage) > 0 ? "text-green-600 bg-green-50 px-2 py-0.5 rounded text-[12px] font-medium" : calcTotalComp(comparePackage) - calcTotalComp(primaryPackage) < 0 ? "text-red-500 bg-red-50 px-2 py-0.5 rounded text-[12px] font-medium" : "text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-0.5 rounded text-[12px] font-medium"}>
                    {calcTotalComp(comparePackage) - calcTotalComp(primaryPackage) > 0 ? `+$${Math.abs(calcTotalComp(comparePackage) - calcTotalComp(primaryPackage)).toLocaleString()} more` : calcTotalComp(comparePackage) - calcTotalComp(primaryPackage) < 0 ? `−$${Math.abs(calcTotalComp(comparePackage) - calcTotalComp(primaryPackage)).toLocaleString()} less` : "Equivalent"}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </WidgetWrapper>
  )
}
