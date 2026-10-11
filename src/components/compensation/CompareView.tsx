import { useState } from 'react'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useCompensationStore, defaultPrimaryPackage } from '../../store/useCompensationStore'
import type { RSUGrant, VestingSchedule, VestingPreset, VestingFrequency } from '../../store/useCompensationStore'
import { usePlannerStore } from '../../store/usePlannerStore'
import { useCompensationDisplay } from '../../hooks/useCompensationDisplay'
import { resolveCompensationRetirement, type CompensationRetirementResult } from '../../utils/finance/compensationRetirement'
import { normalizeOfferRetirement } from '../../store/retirementPersistence'
import { createMatchingContract, createWorkplacePlan } from '../../utils/finance/retirementTypes'
import { RetirementEditor } from '../retirement/RetirementEditor'
import { RetirementNumericField } from '../retirement/RetirementNumericField'
import { RetirementResults } from '../retirement/RetirementResults'
import { retirementRange, retirementExtrema } from '../retirement/retirementPresentation'
import { ThemedSelect } from '../ui/ThemedSelect'
import { ThemedDatePicker } from '../ui/ThemedDatePicker'
import { NumberInput } from '../ui/NumberInput'
import { TaxYearNotice } from '../ui/TaxYearNotice'
import { formatMoney } from '../planner/format'

function OfferResults({ title, result, blocked, afterTax }: { title: string; result: CompensationRetirementResult; blocked: boolean; afterTax: boolean }) {
  const unavailable = result.status === 'conversion-needed' ? 'Conversion Needed' : 'Benefits Need Review'
  const amount = (n: number | null) => blocked ? 'Needs Review' : n === null ? unavailable : formatMoney(n)
  return <section className="retirement-summary-card">
    <h3>{title}</h3>
    <dl>
      <div className="retirement-result-row"><dt>Known Compensation</dt><dd>{amount(result.knownCompensation)}</dd></div>
      <div className="retirement-result-row"><dt>Employer Retirement Funding</dt><dd>{blocked ? 'Needs Review' : result.status !== 'ready' ? unavailable : result.employerFunding === null ? 'Funding Unknown' : formatMoney(result.employerFunding)}</dd></div>
      <div className="retirement-result-row"><dt>Employee Cash Outflow</dt><dd>{amount(result.estimate?.employeeCashOutflow ?? null)}</dd></div>
      {afterTax && <div className="retirement-result-row"><dt>Cash After Contributions</dt><dd>{blocked ? 'Needs Review' : result.estimate ? retirementRange(result.estimate.branches.map(b => b.cashAfterContributions), formatMoney, 'Earnings Treatment Needed') : unavailable}</dd></div>}
    </dl>
    {result.employerFunding === null && result.estimate && <p>Pension Value Not Estimated.</p>}
  </section>
}

export function CompareView({ blocked = false }: { blocked?: boolean }) {
  const { comparePackage, setComparePackage, showAfterTax, toggleAfterTax, includePersonalDeductions, setIncludePersonalDeductions } = useCompensationStore()
  const { rawComparePkg, retirementOptions, retirement } = useCompensationDisplay()
  const { setSharedTaxProfile, clearCraLimits } = usePlannerStore()
  const [draft, setDraft] = useState(() => structuredClone(rawComparePkg ?? {
    ...defaultPrimaryPackage, id: 'compare', name: 'Compare Offer', baseSalary: 0,
    pastSalaryChanges: [], rsuGrants: [],
    retirement: { schemaVersion: 1 as const, contracts: [], review: { status: 'ready' as const, issues: [] } },
  }))
  const [invalid, setInvalid] = useState(false)
  const compareRsuGrants = draft.rsuGrants
  const setCompareRsuGrants = (update: (grants: RSUGrant[]) => RSUGrant[]) => setDraft(current => ({ ...current, rsuGrants: update(current.rsuGrants) }))
  const [rsuGrantName, setRsuGrantName] = useState('')
  const [rsuGrantShares, setRsuGrantShares] = useState(0)
  const [rsuGrantPrice, setRsuGrantPrice] = useState(100)
  const [rsuStartDate, setRsuStartDate] = useState(new Date().toISOString().split('T')[0])
  const [rsuPreset, setRsuPreset] = useState<VestingPreset>('4yr-1yr-cliff')
  const [rsuTotalMonths, setRsuTotalMonths] = useState(48)
  const [rsuCliffMonths, setRsuCliffMonths] = useState(12)
  const [rsuFrequency, setRsuFrequency] = useState<VestingFrequency>('monthly')

  const addCompareRsuGrant = () => {
    if (!rsuGrantName || !rsuGrantShares || !rsuGrantPrice) return

    const vestingSchedule: VestingSchedule = {
      preset: rsuPreset,
      totalVestMonths: rsuPreset === 'custom' ? rsuTotalMonths : (rsuPreset === '4yr-1yr-cliff' ? 48 : 36),
      cliffMonths: rsuPreset === 'custom' ? rsuCliffMonths : (rsuPreset === '4yr-1yr-cliff' ? 12 : 0),
      frequency: rsuFrequency
    }

    setCompareRsuGrants(prev => [...prev, {
      id: crypto.randomUUID(),
      grantName: rsuGrantName,
      grantShares: rsuGrantShares,
      grantPrice: rsuGrantPrice,
      grantStartDate: rsuStartDate,
      vestingSchedule
    }])

    setRsuGrantName('')
    setRsuGrantShares(0)
  }

  const removeCompareRsuGrant = (id: string) => {
    setCompareRsuGrants(prev => prev.filter(g => g.id !== id))
  }

  const result = resolveCompensationRetirement(draft, retirementOptions)
  const normalized = normalizeOfferRetirement(draft).retirement
  const patch = (field: keyof typeof draft, value: number | string) => setDraft(current => ({ ...current, [field]: value }))
  const unavailable = (r: CompensationRetirementResult) => r.status === 'conversion-needed' ? 'Conversion Needed' : 'Benefits Need Review'
  const delta = (left: number[] | null, right: number[] | null) => {
    if (invalid || blocked) return 'Needs Review'
    if (!left || !right) return 'Unknown'
    if (!left.length || !right.length) return 'Earnings Treatment Needed'
    const [leftLow, leftHigh] = retirementExtrema(left); const [rightLow, rightHigh] = retirementExtrema(right)
    return retirementRange([rightLow - leftHigh, rightHigh - leftLow], n => n === 0 ? 'Equivalent' : `${n > 0 ? '+' : '-'}${formatMoney(Math.abs(n))} ${n > 0 ? 'more' : 'less'}`)
  }
  const preciseDelta = (field: 'knownCompensation' | 'employerFunding') => {
    if (invalid || blocked) return 'Needs Review'
    if (retirement.primary.status !== 'ready') return unavailable(retirement.primary)
    if (result.status !== 'ready') return unavailable(result)
    return delta(retirement.primary[field] === null ? null : [retirement.primary[field]!], result[field] === null ? null : [result[field]!])
  }
  const estimateDelta = (cash: boolean) => {
    if (invalid || blocked) return 'Needs Review'
    const left = retirement.primary.estimate
    const right = result.estimate
    if (!left || !right) return unavailable(!left ? retirement.primary : result)
    return cash
      ? delta(left.branches.map(b => b.cashAfterContributions), right.branches.map(b => b.cashAfterContributions))
      : delta([left.employeeCashOutflow!], [right.employeeCashOutflow!])
  }
  const inputClass = 'w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)]'
  const labelClass = 'text-[12px] text-[var(--color-text-secondary)]'
  const known = (n: number) => invalid || blocked ? 'Needs Review' : formatMoney(n)
  const summary = <section className="retirement-summary-card">
    <h3>{result.totalCompensation === null ? 'Known Compensation' : 'Total Compensation'}</h3>
    <strong>{invalid || blocked ? 'Needs Review' : result.knownCompensation === null ? unavailable(result) : formatMoney(result.knownCompensation)}</strong>
    <p>Cash Salary (CAD): {known(result.breakdown.salary)}</p>
    <p>Cash Bonus (CAD): {known(result.breakdown.cashBonus)}</p>
    <p>RSU Vest Value (USD): {known(result.breakdown.rsuNative)}</p>
    {result.legacyEmployerEstimate !== null && <p>Legacy RRSP Estimate: {known(result.legacyEmployerEstimate)}</p>}
    {result.employerFunding === null && result.estimate && <p>Pension Funding Unknown. Pension Value Not Estimated.</p>}
  </section>
  const payContent = <>
    <label className="retirement-field">Offer Name<input value={draft.name} onChange={e => patch('name', e.target.value)} /></label>
    <RetirementNumericField label="Company Stock Price ($)" value={draft.companyCurrentPrice} onChange={v => patch('companyCurrentPrice', v ?? 0)} />
    <RetirementNumericField label="Base Salary ($)" value={draft.baseSalary} onChange={v => patch('baseSalary', v ?? 0)} />
    <RetirementNumericField label="Cash Bonus (%)" value={draft.cashBonusPercent} onChange={v => patch('cashBonusPercent', v ?? 0)} />
    <label className="retirement-field">Bonus Month<select value={draft.cashBonusMonth} onChange={e => patch('cashBonusMonth', Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2026, i).toLocaleString('en', { month: 'short' })}</option>)}</select></label>
    <RetirementNumericField label="ESPP (%)" value={draft.esppContributionPercent} max={100} onChange={v => patch('esppContributionPercent', v ?? 0)} />
    <RetirementNumericField label="Discount (%)" value={draft.esppDiscountPercent} max={100} onChange={v => patch('esppDiscountPercent', v ?? 0)} />
    <RetirementNumericField label="Lock-In Price ($)" value={draft.esppLockedInPrice} onChange={v => patch('esppLockedInPrice', v ?? 0)} />
    <label className="retirement-field">Lock-In End Date<input type="date" value={draft.esppLockInEndDate} onChange={e => patch('esppLockInEndDate', e.target.value)} /></label>
    <label className="retirement-check"><input type="checkbox" checked={includePersonalDeductions} onChange={e => setIncludePersonalDeductions(e.target.checked)} />Include Personal Deductions</label>
    <p>Shared personal deductions are {includePersonalDeductions ? 'included' : 'excluded'}. Saved amounts and shared CRA settings are retained for both offers.</p>
    {/* RSU / Equity Grant */}
    <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-[var(--color-border)]">
      <label className={labelClass}>RSU / Equity Grant</label>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="compare-grant-name">Grant Name</label>
        <input id="compare-grant-name" type="text" value={rsuGrantName} onChange={(e) => setRsuGrantName(e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="compare-grant-shares">Number of Shares</label>
        <NumberInput id="compare-grant-shares" value={rsuGrantShares} onCommit={setRsuGrantShares} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="compare-grant-price">Grant Price ($)</label>
          <NumberInput id="compare-grant-price" value={rsuGrantPrice} onCommit={setRsuGrantPrice} maxDecimals={3} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="compare-grant-date">Grant Start Date</label>
          <ThemedDatePicker id="compare-grant-date" value={rsuStartDate} onChange={setRsuStartDate} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="compare-grant-vesting">Vesting</label>
          <ThemedSelect
            id="compare-grant-vesting" value={rsuPreset}
            onChange={(v) => setRsuPreset(v as VestingPreset)}
            options={[
              { value: '4yr-1yr-cliff', label: '4yr / 1yr Cliff' },
              { value: '3yr-no-cliff', label: '3yr / No Cliff' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="compare-grant-frequency">Frequency</label>
          <ThemedSelect
            id="compare-grant-frequency" value={rsuFrequency}
            onChange={(v) => setRsuFrequency(v as VestingFrequency)}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
            ]}
          />
        </div>
      </div>
      {rsuPreset === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="compare-grant-months">Total Vest (months)</label>
            <NumberInput id="compare-grant-months" value={rsuTotalMonths} onCommit={setRsuTotalMonths} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="compare-grant-cliff">Cliff (months)</label>
            <NumberInput id="compare-grant-cliff" value={rsuCliffMonths} onCommit={setRsuCliffMonths} className={inputClass} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={addCompareRsuGrant}
        className="w-full py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md text-[14px] font-medium hover:bg-[var(--color-bg-primary)] transition-colors"
      >
        Add Grant
      </button>

      {compareRsuGrants.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {compareRsuGrants.map(grant => (
            <div key={grant.id} className="flex justify-between items-center p-2 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border)]">
              <span className="text-[14px] text-[var(--color-text-primary)]">{grant.grantName} ({grant.grantShares.toLocaleString()} shares)</span>
              <button
                type="button"
                onClick={() => removeCompareRsuGrant(grant.id)}
                className="text-[12px] text-error hover:opacity-80 transition-opacity"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

  </>
  return <WidgetWrapper title="Offer Comparison">
    {normalized.review.status !== 'ready' && <div role="alert" className="retirement-notice">
      <p>Comparison Benefits Need Review. Enter actual plan terms; old match percentages do not establish participation or withdrawal restrictions.</p>
      {normalized.review.issues.map((issue, i) => <p key={i}>{issue.message}</p>)}
      {normalized.review.raw !== undefined && <pre className="retirement-raw">{JSON.stringify(normalized.review.raw)}</pre>}
      <button type="button" className="retirement-button" onClick={() => setDraft(current => ({ ...current, retirement: { schemaVersion: 1, contracts: [createMatchingContract(createWorkplacePlan('group-rrsp', crypto.randomUUID()))], review: { status: 'ready', issues: [] } } }))}>Enter Actual Plan Terms</button>
    </div>}
    <RetirementEditor mode="contract" contracts={normalized.contracts}
      onContractsChange={contracts => setDraft(current => ({ ...current, retirement: { schemaVersion: 1, contracts, review: { status: 'ready', issues: [] } } }))}
      profile={retirementOptions.profile} onProfileChange={setSharedTaxProfile} onClearCraLimits={clearCraLimits}
      onValidityChange={setInvalid} summary={summary} payContent={payContent}
      reviewContent={<>{result.assumptions.map((a, i) => <p key={i}>{a}</p>)}{result.estimate ? <><RetirementResults estimate={result.estimate} blocked={invalid || blocked} />{result.estimate.status === 'uncertain' && <p>{result.estimate.branchStatus === 'unavailable' ? 'Earnings Treatment Needed. Dependent results unavailable.' : `All ${result.estimate.branches.length} comparison earnings combinations are included in ranges.`}</p>}</> : <p>{unavailable(result)}</p>}</>} />
    <button type="button" className="retirement-button retirement-primary" disabled={invalid} onClick={() => setComparePackage(draft)}>Calculate Comparison</button>
    {comparePackage && <section aria-label="Offer Comparison Results" className="retirement-group">
      <div className="grid grid-cols-1 desktop:grid-cols-2 gap-3">
        <OfferResults title="Current Offer" result={retirement.primary} blocked={invalid || blocked} afterTax={showAfterTax} />
        <OfferResults title="Compare Offer" result={result} blocked={invalid || blocked} afterTax={showAfterTax} />
      </div>
      <div className="flex flex-wrap gap-2"><button type="button" className="retirement-button" onClick={() => showAfterTax && toggleAfterTax()}>Gross</button><button type="button" className="retirement-button" onClick={() => !showAfterTax && toggleAfterTax()}>After-Tax</button></div>
      <p><span>Known Compensation Delta</span>: <strong>{preciseDelta('knownCompensation')}</strong></p>
      <p><span>Employer Retirement Funding Delta</span>: <strong>{preciseDelta('employerFunding')}</strong></p>
      <p><span>Employee Cash Outflow Delta</span>: <strong>{estimateDelta(false)}</strong></p>
      {showAfterTax && <><p><span>Cash After Contributions Delta</span>: <strong>{estimateDelta(true)}</strong></p><TaxYearNotice />{(result.estimate?.status === 'uncertain' || retirement.primary.estimate?.status === 'uncertain') && <p>Earnings Treatment Needed. {(result.estimate?.branchStatus === 'unavailable' || retirement.primary.estimate?.branchStatus === 'unavailable') ? 'Dependent cash results unavailable; known amounts are retained.' : 'All earnings combinations are included in ranges.'}</p>}</>}
    </section>}
  </WidgetWrapper>
}
