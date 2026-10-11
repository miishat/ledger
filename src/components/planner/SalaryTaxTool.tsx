import React, { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { usePlannerStore, useToolInputs } from '../../store/usePlannerStore'
import {
  FEDERAL_BRACKETS,
  ontarioHealthPremium,
  PROVINCES,
  PROVINCIAL_TAX,
  type Bracket,
  type Province,
} from '../../utils/finance/canadaTax'
import { SelectField } from './SelectField'
import { ResultCard } from './ResultCard'
import { formatMoney, formatMoneyCompact } from './format'
import { createRetirementScenario } from '../../utils/finance/retirementTypes'
import { estimateRetirement, retirementMarginalBreakdown } from '../../utils/finance/retirementEstimate'
import { RetirementEditor } from '../retirement/RetirementEditor'
import { RetirementNumericField } from '../retirement/RetirementNumericField'
import { RetirementResults, RetirementSummary } from '../retirement/RetirementResults'
import { retirementRange } from '../retirement/retirementPresentation'
import { DeductionsBreakdown } from './DeductionsBreakdown'
import { RrspEfficiencyCard } from './RrspEfficiencyCard'
import { TaxYearNotice } from '../ui/TaxYearNotice'
import { Sheet } from '../ui/Sheet'

const TOOL_ID = 'salary-tax'
const DEFAULTS = { income: 100000, province: 'ON' as string, rrsp: 0, fhsa: 0, rrspRoom: 0 }

/** Bracket visual: one visually separate segment per bracket, with a rate
 *  label, income-range caption, and accent fill for the portion of income
 *  inside that bracket. */
export const BracketBar: React.FC<{ title: string; brackets: Bracket[]; income: number }> = ({ title, brackets, income }) => {
  const cap = Math.max(income * 1.25, 1)
  const segments = brackets
    .reduce<Array<{ start: number; end: number; rate: number }>>((acc, b) => {
      const start = acc.length > 0 ? acc[acc.length - 1].end : 0
      const end = Math.min(b.upTo, cap)
      if (end > start) acc.push({ start, end, rate: b.rate })
      return acc
    }, [])
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] uppercase tracking-wide text-text-secondary">{title}</span>
      <div className="flex w-full gap-1">
        {segments.map((s) => {
          const width = ((s.end - s.start) / cap) * 100
          const filledTo = Math.min(Math.max(income - s.start, 0), s.end - s.start)
          const filledPct = (s.end - s.start > 0 ? filledTo / (s.end - s.start) : 0) * 100
          const active = income > s.start
          return (
            <div key={s.start} className="@container flex flex-col gap-1 min-w-0 overflow-hidden" style={{ flex: `${width} 1 0%` }}>
              <div className={`@container relative h-7 rounded-md overflow-hidden border ${active ? 'border-accent/60' : 'border-border'} bg-bg-primary/40`}
                   title={`${(s.rate * 100).toFixed(2)}% on ${formatMoney(s.start)} to ${formatMoney(s.end)}`}>
                {/* /45 not /60: the rate label sits on top of this fill, and at
                    60% the composite was 4.27:1 against the label in aurora and
                    4.19:1 in glass, both under AA. Lowering the accent share
                    moves the fill toward the page background, which raises
                    contrast in dark and light themes alike. */}
                {/* Fill and track are necessarily close in tone once the fill is
                    light enough for the label on top of it to read, so the
                    filled/unfilled boundary cannot rely on colour alone: WCAG
                    1.4.11 asks 3:1 for a graphical object against its
                    surroundings, and the two tones alone fall well short of
                    that in every theme. A full-strength accent edge is the
                    non-colour channel that keeps the boundary legible. Only
                    render it once there is a fill to bound, or an empty
                    bracket grows a stray line at its own left edge. */}
                <div
                  className={`absolute inset-y-0 left-0 bg-accent/45 ${filledPct > 0 ? 'border-r-2 border-accent' : ''}`}
                  style={{ width: `${filledPct}%` }}
                />
                <span className="absolute inset-0 hidden @min-[44px]:flex items-center justify-center text-meta font-medium text-text-primary">
                  {(s.rate * 100).toFixed(1)}%
                </span>
              </div>
              <span className="hidden text-micro text-text-secondary text-center whitespace-nowrap @min-[88px]:block @min-[120px]:hidden">
                {formatMoneyCompact(s.start)}{s.end < cap ? ` to ${formatMoneyCompact(s.end)}` : '+'}
              </span>
              <span className="hidden text-micro text-text-secondary text-center whitespace-nowrap @min-[120px]:block">
                {formatMoney(s.start)}{s.end < cap ? ` to ${formatMoney(s.end)}` : '+'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const SalaryTaxTool: React.FC = () => {
  const [bracketInfoOpen, setBracketInfoOpen] = useState(false)
  const bracketInfoButtonRef = useRef<HTMLButtonElement>(null)
  const [invalidDraft, setInvalidDraft] = useState(false)
  const [resetNotice, setResetNotice] = useState(false)
  const [editorEpoch, setEditorEpoch] = useState(0)
  const inputs = useToolInputs(TOOL_ID, DEFAULTS)
  const saved = usePlannerStore(s => s.salaryRetirementScenario)
  const profile = usePlannerStore(s => s.sharedTaxProfile)
  const profileReview = usePlannerStore(s => s.sharedTaxReview)
  const scenarioReview = usePlannerStore(s => s.salaryRetirementReview)
  const update = usePlannerStore(s => s.updateSalaryRetirementScenario)
  const setProfile = usePlannerStore(s => s.setSharedTaxProfile)
  const clearLimits = usePlannerStore(s => s.clearCraLimits)
  const reset = usePlannerStore(s => s.resetSalaryRetirementScenario)
  const scenario = saved ?? { ...createRetirementScenario(), cashEmploymentIncome: inputs.income, personalRrsp: inputs.rrsp, personalFhsa: inputs.fhsa }
  const province = profile.province
  useEffect(() => {
    const state = usePlannerStore.getState()
    if (state.salaryRetirementScenario !== null) return
    const old = state.inputs['salary-tax'] ?? state.inputs['income-tax'] ?? state.inputs['take-home-pay']
    state.updateSalaryRetirementScenario({ ...createRetirementScenario(), cashEmploymentIncome: typeof old?.income === 'number' ? old.income : typeof old?.gross === 'number' ? old.gross : 100000, personalRrsp: typeof old?.rrsp === 'number' ? old.rrsp : 0, personalFhsa: typeof old?.fhsa === 'number' ? old.fhsa : 0 })
    if (old?.province && !state.inputs['salary-tax']) state.setSharedTaxProfile({ province: old.province as Province })
  }, [])
  const estimate = estimateRetirement(scenario, profile)
  const marginal = retirementMarginalBreakdown(scenario, profile)
  const blocked = invalidDraft || estimate.status === 'invalid' || profileReview.status === 'invalid' || scenarioReview.status === 'invalid'
  const ranged = (select: (branch: (typeof estimate.branches)[number]) => number, formatter = formatMoney) => blocked ? 'Needs Review' : retirementRange(estimate.branches.map(select), formatter)
  const percentages = (n: number) => `${n.toFixed(2)}%`
  const t = estimate.branches.length === 1 && !blocked ? estimate.branches[0].tax : null
  const breakdown = marginal.branches.length === 1 && !blocked ? marginal.branches[0] : null
  const premium = t && province === 'ON' ? ontarioHealthPremium(t.provincialTaxableIncome) : 0
  const reduction = t && province === 'ON' ? Math.max(0, premium - t.provincialAdjustments) : 0
  const reductionLabel = province === 'BC' ? 'Annual BC tax reduction' : province === 'AB' ? 'Annual Alberta supplemental credit' : null
  const review = <div className="retirement-results">
    <div className="retirement-results-grid"><ResultCard label="Total Income Tax" value={ranged(b => b.tax.federal + b.tax.provincial)} highlight /><ResultCard label="Marginal Rate" value={blocked ? 'Needs Review' : retirementRange(marginal.branches.map(b => b.total), percentages)} /><ResultCard label="Effective Rate" value={ranged(b => scenario.cashEmploymentIncome > 0 ? (b.tax.federal + b.tax.provincial) / scenario.cashEmploymentIncome * 100 : 0, percentages)} /></div>
    <div className="retirement-results-grid"><ResultCard label="Taxable Income" value={ranged(b => b.tax.taxableIncome)} /><ResultCard label="Tax Savings From Contributions" value={ranged(b => b.taxSavings)} highlight /></div>
    <p className="retirement-help">Tax savings retain the same earnings, employer funding and statutory bases with employee/member deductions removed. Employer RRSP deduction and employer PRPP capacity reduction remain in the baseline; no refund is added twice.</p>
    <div className="themed-card rounded-lg p-4 flex flex-col gap-4 min-w-0">
      {t ? <><BracketBar title="Federal Brackets" brackets={FEDERAL_BRACKETS} income={t.taxableIncome} /><BracketBar title={`${PROVINCIAL_TAX[province].name} Brackets`} brackets={PROVINCIAL_TAX[province].brackets} income={t.provincialTaxableIncome} /></> : <p className="retirement-help">{blocked ? 'Tax brackets need reviewed inputs.' : 'Earnings Treatment Needed for precise bracket fills.'}</p>}
      <div className="flex flex-col gap-1"><div className="flex items-center gap-1"><span className="text-[12px] uppercase tracking-wide text-text-secondary">Marginal Rate Breakdown</span><button ref={bracketInfoButtonRef} type="button" aria-label="About brackets and marginal rates" aria-expanded={bracketInfoOpen} aria-haspopup="dialog" onClick={() => setBracketInfoOpen(open => !open)} className="rounded-full p-1 text-text-secondary hover:text-accent min-h-[44px] min-w-[44px] desktop:min-h-0 desktop:min-w-0 flex items-center justify-center"><Info className="h-4 w-4" aria-hidden="true" /></button>
        <Sheet open={bracketInfoOpen} onClose={() => setBracketInfoOpen(false)} desktop="popover" anchorRef={bracketInfoButtonRef} ariaLabel="Brackets and marginal rates help" title="Brackets and marginal rates" panelClassName="w-[26rem] max-w-[calc(100vw-1rem)] themed-menu rounded-lg shadow-xl p-4" contentClassName="flex flex-col gap-2"><h3 className="text-[14px] font-semibold text-text-primary">How to read these rates</h3><p className="text-[13px] text-text-secondary">Filled portion = income inside each bracket. Federal brackets use {ranged(b => b.tax.taxableIncome)} taxable income after deductions{province === 'QC' ? `; Quebec brackets use ${ranged(b => b.tax.provincialTaxableIncome)}` : ''}.</p><p className="text-[13px] text-text-secondary">Marginal percentages measure income-tax change for an additional $100 of cash pay with entered retirement dollars fixed. Credit and provincial adjustments can differ from bracket rates. This is not a cash change or recalculated salary-linked match.</p></Sheet></div>
        {breakdown ? <div className="text-[13px] leading-relaxed text-text-primary"><span className="whitespace-nowrap mr-1">Federal {breakdown.federal.toFixed(2)}%</span>{' '}<span className="whitespace-nowrap mr-1">+ Provincial {breakdown.provincialBase.toFixed(2)}%</span>{breakdown.surtax > 0 && <>{' '}<span className="whitespace-nowrap mr-1">+ ON surtax {breakdown.surtax.toFixed(2)}%</span></>}{Math.abs(breakdown.adjustments).toFixed(2) !== '0.00' && <>{' '}<span className="whitespace-nowrap mr-1">{breakdown.adjustments < 0 ? '−' : '+'} Provincial adjustments {Math.abs(breakdown.adjustments).toFixed(2)}%</span></>}{' '}<span className="font-semibold whitespace-nowrap">= {breakdown.total.toFixed(2)}%</span></div> : <p className="retirement-help">{blocked ? 'Marginal breakdown needs reviewed inputs.' : 'Earnings Treatment Needed for component breakdown; total marginal range is shown above.'}</p>}
        {t && (premium > 0 || reduction > 0 || (reductionLabel && t.provincialAdjustments < 0)) && <div className="text-[12px] leading-relaxed text-text-secondary"><span className="mr-1">Included in annual Provincial Tax:</span>{' '}{premium > 0 && <span>Annual Ontario Health Premium <strong className="font-medium text-text-primary">{formatMoney(premium)}</strong></span>}{reduction > 0 && <>{premium > 0 ? '; ' : ''}<span>Ontario tax reduction <strong className="font-medium text-text-primary">{formatMoney(-reduction)}</strong></span></>}{reductionLabel && t.provincialAdjustments < 0 && <span>{reductionLabel} <strong className="font-medium text-text-primary">{formatMoney(t.provincialAdjustments)}</strong></span>}</div>}
      </div>
    </div>
    <RetirementResults estimate={estimate} blocked={blocked} />
    <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4 min-w-0">{t ? <DeductionsBreakdown t={t} employeeContributions={estimate.employeeCashOutflow ?? 0} cashGross={scenario.cashEmploymentIncome} /> : <section className="themed-card rounded-lg p-4"><p className="retirement-help">{blocked ? 'Cash breakdown needs reviewed inputs.' : 'Earnings Treatment Needed for a precise stacked chart. Reconciliation ranges include every branch.'}</p></section>}<RrspEfficiencyCard scenario={scenario} profile={profile} blocked={blocked} /></div>
    {scenario.provenance?.source === 'compensation' && <div className="retirement-notice"><strong>{scenario.provenance.editedAfterTransfer ? 'Edited After Transfer' : 'Transferred From Compensation'}</strong><p>{scenario.provenance.sourceTimeMode === 'next-one-year' ? 'Annualized Using 2026 Rules.' : 'Current-year annual scenario.'} Original source details are provenance; realized equity and ESPP are already included once in cash pay. Shared CRA values remain live inputs.</p>{Array.isArray(scenario.provenance.assumptions) && scenario.provenance.assumptions.every(a => typeof a === 'string') ? scenario.provenance.assumptions.map((assumption, i) => <p key={i}>{assumption}</p>) : <p>Saved source assumptions need review: {JSON.stringify(scenario.provenance.assumptions)}</p>}</div>}
    {(scenarioReview.status === 'invalid' || profileReview.status === 'invalid') && <div className="retirement-notice" role="alert"><strong>Saved Inputs Need Review</strong>{[...scenarioReview.issues, ...profileReview.issues].map((issue, i) => <p key={i}>{issue.message}</p>)}<details><summary>Preserved Saved Values</summary><pre className="retirement-raw">{JSON.stringify({ salary: scenarioReview.raw, profile: profileReview.raw }, null, 2)}</pre></details></div>}
    <p className="retirement-help">Resetting this scenario also resets shared Personal RRSP and FHSA amounts used by Compensation when included. Province and CRA limits are retained.</p><button type="button" className="retirement-button" onClick={() => { reset(); setInvalidDraft(false); setEditorEpoch(n => n + 1); setResetNotice(true) }}>Reset Salary Scenario</button>
  </div>
  return <div className="flex flex-col gap-4 min-w-0"><TaxYearNotice showYearLabel />{resetNotice && <p className="retirement-notice" role="status">Personal RRSP and FHSA amounts also reset; Compensation changes when it includes those personal deductions. Shared province and CRA limits were retained.</p>}
    <RetirementEditor key={editorEpoch} mode="annual" plans={Array.isArray(scenario.workplacePlans) ? scenario.workplacePlans : []} onPlansChange={workplacePlans => update({ workplacePlans })} profile={profile} onProfileChange={setProfile} onClearCraLimits={clearLimits} taxYear={scenario.taxYear} onValidityChange={setInvalidDraft}
      payContent={<div className="retirement-fields"><fieldset className="retirement-group"><legend>Pay & Province</legend><RetirementNumericField label="Gross Annual Income" value={scenario.cashEmploymentIncome} onChange={n => update({ cashEmploymentIncome: n ?? 0 })} help="Annual cash employment pay excludes employer retirement funding entered separately." /><SelectField label="Province" value={province} onChange={v => setProfile({ province: v as Province })} options={PROVINCES.map(p => ({ value: p.code, label: p.name }))} /></fieldset><fieldset className="retirement-group"><legend>Personal Contributions</legend><RetirementNumericField label="Personal RRSP Contribution" value={scenario.personalRrsp} onChange={n => update({ personalRrsp: n ?? 0 })} /><RetirementNumericField label="FHSA Contribution" value={scenario.personalFhsa} onChange={n => update({ personalFhsa: n ?? 0 })} /><label className="retirement-check"><input type="checkbox" checked={scenario.includePersonalDeductions} onChange={e => update({ includePersonalDeductions: e.target.checked })} />Include Personal Deductions</label>{!scenario.includePersonalDeductions && <p>Excluded From This Scenario</p>}<p className="retirement-help">Saved personal values stay visible when excluded. Workplace RRSP belongs in its own plan row; do not enter it again here.</p></fieldset></div>}
      reviewContent={review} summary={<RetirementSummary estimate={estimate} profile={profile} blocked={blocked} />} />
  </div>
}
