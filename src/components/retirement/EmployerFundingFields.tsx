import type { MatchingContract, WorkplacePlan } from '../../utils/finance/retirementTypes'
import { ContractFundingFields } from './ContractFundingFields'
import { RetirementNumericField } from './RetirementNumericField'

export function EmployerFundingFields({ plan, contract, onPlanChange, onContractChange }: {
  plan: WorkplacePlan
  contract: MatchingContract | null
  onPlanChange: (patch: Partial<WorkplacePlan>) => void
  onContractChange: (patch: Partial<MatchingContract>) => void
}) {
  return <>
    {contract && plan.kind !== 'db-rpp'
      ? <ContractFundingFields contract={contract} onChange={onContractChange} />
      : <RetirementNumericField
        label="Employer Annual Contribution"
        value={plan.employerContribution}
        nullable={plan.kind === 'db-rpp'}
        onChange={employerContribution => onPlanChange({ employerContribution })}
        help={plan.kind === 'db-rpp'
          ? 'Blank means Pension Funding Not Entered.'
          : 'Annual employer dollars, separate from your cash pay.'}
      />}
    {plan.kind === 'db-rpp' && plan.employerContribution === null && <p>Pension Funding Not Entered</p>}
    {['dc-rpp', 'db-rpp', 'rrsp-dpsp'].includes(plan.kind) && (
      <RetirementNumericField label="Administrator PA" value={plan.administratorPa} nullable
        onChange={administratorPa => onPlanChange({ administratorPa })}
        help="Optional actual statement value overrides the ordinary estimate. DB PA remains unknown when blank." />
    )}
    {['dc-rpp', 'rrsp-dpsp'].includes(plan.kind) && <details>
      <summary>Advanced Registered-Plan Rules</summary>
      <RetirementNumericField label="Registered-Plan Compensation" value={plan.registeredPlanCompensation} nullable
        onChange={registeredPlanCompensation => onPlanChange({ registeredPlanCompensation })}
        help="Confirmed statutory compensation, separate from matching earnings. Blank means Earnings Limit Not Verified." />
      <label className="retirement-check">
        <input type="checkbox" checked={plan.ordinaryAggregate !== false}
          onChange={event => onPlanChange({ ordinaryAggregate: event.target.checked })} />
        Ordinary Contribution-Only Provisions
      </label>
      <p className="retirement-help">
        DB provisions, forfeitures, surplus allocations and multiple employers can change legal checks.
        Confirm with your administrator; this is not certification of all legal limits.
      </p>
    </details>}
    {['prpp', 'vrsp'].includes(plan.kind) && <label className="retirement-check">
      <input type="checkbox" checked={plan.memberDirection}
        onChange={event => onPlanChange({ memberDirection: event.target.checked })} />
      Member Direction Confirmed for Employer Funding Above the RRSP Dollar Limit
    </label>}
  </>
}
