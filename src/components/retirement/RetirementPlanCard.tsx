import {
  createMatchingContract, createWorkplacePlan, validateWorkplacePlan,
  type MatchingContract, type RetirementPlanKind, type WorkplacePlan,
} from '../../utils/finance/retirementTypes'
import { resolveMatchingPlan } from '../../utils/finance/retirementMatching'
import { EmployerFundingFields } from './EmployerFundingFields'
import { WorkplacePlanFields } from './WorkplacePlanFields'
import { PLAN_NAMES } from './retirementPresentation'

export function RetirementPlanCard({ plan, contract, number, funding, onReplace, onContractChange, onRemove }: {
  plan: WorkplacePlan
  contract: MatchingContract | null
  number: number
  funding: boolean
  onReplace: (plan: WorkplacePlan) => void
  onContractChange: (patch: Partial<MatchingContract>) => void
  onRemove: () => void
}) {
  if (!plan || typeof plan !== 'object' || !PLAN_NAMES[plan.kind]) {
    return <fieldset className="retirement-group">
      <legend>Plan {number} Needs Review</legend>
      <p role="alert">Saved retirement row has malformed plan details. Precise results are unavailable.</p>
      <pre className="retirement-raw">{JSON.stringify(plan, null, 2)}</pre>
      <button type="button" className="retirement-button"
        onClick={() => onReplace(createWorkplacePlan('group-rrsp', crypto.randomUUID()))}>Repair Plan {number}</button>
      <button type="button" className="retirement-button" onClick={onRemove}>Remove Plan {number}</button>
    </fieldset>
  }
  if (contract && (!contract.employee || typeof contract.employee !== 'object'
    || !contract.unconditionalEmployer || typeof contract.unconditionalEmployer !== 'object'
    || !Array.isArray(contract.tiers))) {
    return <fieldset className="retirement-group">
      <legend>Plan {number}: Matching Terms Need Review</legend>
      <p role="alert">Saved matching objects need review. Values are preserved below.</p>
      <pre className="retirement-raw">{JSON.stringify(contract, null, 2)}</pre>
      <button type="button" className="retirement-button"
        onClick={() => onContractChange(createMatchingContract(plan))}>Repair Matching Terms for Plan {number}</button>
      <button type="button" className="retirement-button" onClick={onRemove}>Remove Plan {number}</button>
    </fieldset>
  }

  const onPlanChange = (patch: Partial<WorkplacePlan>) => onReplace({ ...plan, ...patch })
  const onKindChange = (kind: RetirementPlanKind) => {
    const next = { ...createWorkplacePlan(kind, plan.id), name: plan.name, employeeContribution: plan.employeeContribution }
    if (contract) onContractChange({ ...createMatchingContract(next), employee: { mode: 'dollars', value: plan.employeeContribution } })
    else onReplace(next)
  }
  const issues = contract
    ? resolveMatchingPlan(contract, { baseSalary: 0, cashBonus: 0 }).issues
    : validateWorkplacePlan(plan)

  return <fieldset className="retirement-group">
    <legend>Plan {number}: {(typeof plan.name === 'string' && plan.name) || PLAN_NAMES[plan.kind]}</legend>
    {funding
      ? <EmployerFundingFields plan={plan} contract={contract} onPlanChange={onPlanChange} onContractChange={onContractChange} />
      : <WorkplacePlanFields plan={plan} contract={contract} number={number} onPlanChange={onPlanChange}
        onContractChange={onContractChange} onKindChange={onKindChange} onRemove={onRemove} />}
    {issues.length > 0 && <div role="alert">
      {issues.map((issue, index) => <p key={index}>{issue.message}</p>)}
      <details><summary>Saved Row Values</summary>
        <pre className="retirement-raw">{JSON.stringify(contract ?? plan, null, 2)}</pre>
      </details>
    </div>}
  </fieldset>
}
