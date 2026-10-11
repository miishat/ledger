import { useCallback, useState } from 'react'
import { useCompensationStore } from '../../store/useCompensationStore'
import { usePlannerStore } from '../../store/usePlannerStore'
import { useCompensationDisplay } from '../../hooks/useCompensationDisplay'
import { RetirementEditor } from '../retirement/RetirementEditor'
import { RetirementNumericField } from '../retirement/RetirementNumericField'
import { RetirementResults, RetirementSummary } from '../retirement/RetirementResults'
import { createMatchingContract, createWorkplacePlan } from '../../utils/finance/retirementTypes'
import { normalizeOfferRetirement } from '../../store/retirementPersistence'
import { formatMoney } from '../planner/format'
import { PROVINCIAL_TAX, type Province } from '../../utils/finance/canadaTax'

export function CompensationRetirementWorkspace({ onValidityChange }: { onValidityChange?: (invalid: boolean) => void }) {
  const { rawPkg, retirement: { primary: result }, retirementOptions } = useCompensationDisplay()
  const { setPrimaryPackage, setRetirementContracts, includePersonalDeductions, setIncludePersonalDeductions } = useCompensationStore()
  const { setSharedTaxProfile, clearCraLimits, setInput } = usePlannerStore()
  const [invalid, setInvalid] = useState(false)
  const reportValidity = useCallback((value: boolean) => { setInvalid(value); onValidityChange?.(value) }, [onValidityChange])
  const normalized = normalizeOfferRetirement(rawPkg).retirement
  const leadingLabel = result.totalCompensation === null ? 'Known Compensation' : 'Total Compensation'
  const knownAmount = (value: number) => invalid ? 'Needs Review' : formatMoney(value)
  const summary = result.estimate ? (
    <RetirementSummary
      estimate={result.estimate}
      profile={retirementOptions.profile}
      blocked={invalid}
      leadingLabel={leadingLabel}
      leadingValue={formatMoney(result.totalCompensation ?? result.knownCompensation ?? 0)}
    />
  ) : (
    <section className="retirement-summary-card" data-key-figure>
      <h3>{result.status === 'conversion-needed' ? 'Conversion Needed' : 'Benefits Need Review'}</h3>
      <p>Cash Salary (CAD): {knownAmount(result.breakdown.salary)}</p>
      <p>Cash Bonus (CAD): {knownAmount(result.breakdown.cashBonus)}</p>
      <p>RSU Vest Value (USD): {knownAmount(result.breakdown.rsuNative)}</p>
      {result.legacyEmployerEstimate !== null && (
        <p>Legacy Employer Estimate (CAD): {knownAmount(result.legacyEmployerEstimate)}</p>
      )}
    </section>
  )
  const payContent = (
    <>
      <fieldset className="retirement-group">
        <legend>Cash Pay</legend>
        <label className="retirement-field">
          <span>Province</span>
          <select
            value={retirementOptions.profile.province}
            onChange={e => setSharedTaxProfile({ province: e.target.value as Province })}
          >
            {Object.entries(PROVINCIAL_TAX).map(([code, details]) => (
              <option key={code} value={code}>{details.name}</option>
            ))}
          </select>
        </label>
        <RetirementNumericField
          label="Annual Base Salary (CAD)"
          value={rawPkg.baseSalary}
          onChange={v => setPrimaryPackage({ baseSalary: v ?? 0 })}
        />
        <RetirementNumericField
          label="Cash Bonus (%)"
          value={rawPkg.cashBonusPercent}
          onChange={v => setPrimaryPackage({ cashBonusPercent: v ?? 0 })}
        />
        <p className="retirement-help">Salary history, bonus payment month, equity grants and ESPP terms remain available in Edit Package.</p>
      </fieldset>
      <fieldset className="retirement-group">
        <legend>Personal Deductions</legend>
        <label className="retirement-check">
          <input
            type="checkbox"
            checked={includePersonalDeductions}
            onChange={e => setIncludePersonalDeductions(e.target.checked)}
          />
          Include Personal Deductions
        </label>
        <RetirementNumericField
          label="Personal RRSP (CAD)"
          value={retirementOptions.personalRrsp}
          onChange={v => setInput('salary-tax', 'rrsp', v ?? 0)}
        />
        <RetirementNumericField
          label="Personal FHSA (CAD)"
          value={retirementOptions.personalFhsa}
          onChange={v => setInput('salary-tax', 'fhsa', v ?? 0)}
        />
        <p className="retirement-help">Amounts and tax settings are shared with Salary & Tax. Excluding personal deductions preserves the saved amounts.</p>
      </fieldset>
    </>
  )
  const reviewContent = (
    <>
      {result.assumptions.map((assumption, i) => <p className="retirement-help" key={i}>{assumption}</p>)}
      {result.estimate ? (
        <RetirementResults estimate={result.estimate} blocked={invalid} />
      ) : (
        <p>{result.status === 'conversion-needed'
          ? 'Conversion Needed. Supply a usable CAD exchange rate before using combined compensation, tax estimates or transfer.'
          : 'Review workplace terms before using precise results.'}</p>
      )}
    </>
  )
  return (
    <section aria-label="Compensation Benefits Workspace">
      {normalized.review.status !== 'ready' && (
        <div className="retirement-notice" role="alert">
          <h2>{normalized.review.status === 'legacy' ? 'Legacy Benefits Need Review' : 'Saved Benefits Need Review'}</h2>
          <p>Old match percentages do not establish participation, matching ratios, or withdrawal restrictions. Enter actual contract terms. An annual-dollar Group RRSP estimate can be entered as unconditional employer funding with explicit restrictions.</p>
          {normalized.review.issues.map((issue, i) => <p key={i}>{issue.message}</p>)}
          {normalized.review.raw !== undefined && <pre className="retirement-raw">{JSON.stringify(normalized.review.raw)}</pre>}
          <button
            type="button"
            className="retirement-button"
            onClick={() => setRetirementContracts('primary', [createMatchingContract(createWorkplacePlan('group-rrsp', crypto.randomUUID()))])}
          >
            Enter Actual Plan Terms
          </button>
        </div>
      )}
      {result.estimate && result.totalCompensation === null && (
        <p className="retirement-notice">Pension Funding Unknown. Known compensation excludes employer pension funding that has not been entered. Pension value is not estimated.</p>
      )}
      <RetirementEditor
        mode="contract"
        contracts={normalized.contracts}
        onContractsChange={contracts => setRetirementContracts('primary', contracts)}
        profile={retirementOptions.profile}
        onProfileChange={setSharedTaxProfile}
        onClearCraLimits={clearCraLimits}
        onValidityChange={reportValidity}
        summary={summary}
        payContent={payContent}
        reviewContent={reviewContent}
      />
    </section>
  )
}
