import { useId } from 'react'
import type { MatchingContract, RetirementPlanKind, WorkplacePlan } from '../../utils/finance/retirementTypes'
import { RetirementNumericField } from './RetirementNumericField'
import { PLAN_NAMES } from './retirementPresentation'

export function WorkplacePlanFields({ plan, contract, onPlanChange, onContractChange, onKindChange, onRemove, number }: {
  plan: WorkplacePlan
  contract: MatchingContract | null
  onPlanChange: (patch: Partial<WorkplacePlan>) => void
  onContractChange: (patch: Partial<MatchingContract>) => void
  onKindChange: (kind: RetirementPlanKind) => void
  onRemove: () => void
  number: number
}) {
  const restrictionId = useId()
  const percent = contract?.employee.mode === 'percent' && plan.kind !== 'db-rpp'
  return <>
    <label className="retirement-field">
      <span>Plan Name</span>
      <input type="text" value={typeof plan.name === 'string' ? plan.name : ''}
        onChange={event => onPlanChange({ name: event.target.value })} />
    </label>
    <label className="retirement-field">
      <span>Plan Type</span>
      <select value={plan.kind} onChange={event => onKindChange(event.target.value as RetirementPlanKind)}>
        {Object.entries(PLAN_NAMES).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
      </select>
    </label>
    {contract && plan.kind !== 'db-rpp' && <>
      <label className="retirement-field">
        <span>Eligible Earnings</span>
        <select value={contract.eligibleEarnings}
          onChange={event => onContractChange({ eligibleEarnings: event.target.value as MatchingContract['eligibleEarnings'] })}>
          <option value="base">Base Salary</option>
          <option value="base-plus-bonus">Base Salary Plus Cash Bonus</option>
          <option value="override">Annual Dollar Override</option>
        </select>
      </label>
      {contract.eligibleEarnings === 'override' && (
        <RetirementNumericField label="Eligible Earnings Override" value={contract.eligibleEarningsOverride}
          onChange={eligibleEarningsOverride => onContractChange({ eligibleEarningsOverride })} />
      )}
      <label className="retirement-field">
        <span>Employee Contribution Basis</span>
        <select value={contract.employee.mode} onChange={event => onContractChange({
          employee: { ...contract.employee, mode: event.target.value as 'dollars' | 'percent' },
        })}>
          <option value="dollars">Annual Dollars</option>
          <option value="percent">Percent of Eligible Earnings</option>
        </select>
      </label>
    </>}
    <RetirementNumericField
      label={percent ? 'Employee Contribution Percent' : 'Employee Annual Contribution'}
      value={contract ? contract.employee.value : plan.employeeContribution}
      max={percent ? 100 : undefined}
      onChange={value => contract
        ? onContractChange({ employee: { mode: plan.kind === 'db-rpp' ? 'dollars' : contract.employee.mode, value: value ?? 0 } })
        : onPlanChange({ employeeContribution: value ?? 0 })}
    />
    {plan.kind === 'group-rrsp' && <div className="retirement-field">
      <label htmlFor={restrictionId}>Withdrawal Restrictions</label>
      <select id={restrictionId} aria-describedby={`${restrictionId}-help`} value={plan.withdrawalRestriction}
        onChange={event => onPlanChange({ withdrawalRestriction: event.target.value as WorkplacePlan['withdrawalRestriction'] })}>
        <option value="unknown">Unknown / Confirm Plan Terms</option>
        <option value="restricted">Restricted Until Retirement or Termination</option>
        <option value="withdrawable">Withdrawable</option>
      </select>
      <small id={`${restrictionId}-help`}>
        Restricted permits HBP/LLP exceptions. Unknown terms retain all EI/QPIP earnings combinations.
      </small>
    </div>}
    <p className="retirement-help">
      Personal RRSP is separate from workplace funding. {plan.kind === 'db-rpp'
        ? 'Enter current-service contributions from your plan statement. No match or pension value is inferred.'
        : !contract ? 'Enter annual dollars; employer matching is not inferred.'
          : 'Matching uses annual aggregate terms for the selected period. Dollar amounts are not prorated; per-pay dates and true-ups are excluded.'}
    </p>
    <button type="button" className="retirement-button" onClick={onRemove}>Remove Plan {number}</button>
  </>
}
