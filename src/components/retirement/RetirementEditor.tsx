import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { createMatchingContract, createWorkplacePlan, type MatchingContract, type SharedTaxProfile, type WorkplacePlan } from '../../utils/finance/retirementTypes'
import { RetirementPlanCard } from './RetirementPlanCard'
import { RetirementValidationContext } from './retirementPresentation'
import { CraLimits } from './CraLimits'
import './retirement.css'

type CommonProps = {
  payContent: ReactNode; reviewContent: ReactNode; summary: ReactNode; profile: SharedTaxProfile
  onProfileChange: (updates: Partial<SharedTaxProfile>) => void; onClearCraLimits: () => void
  taxYear?: number; onValidityChange?: (invalid: boolean) => void
}
export type RetirementEditorProps = CommonProps & ({ mode: 'annual'; plans: WorkplacePlan[]; onPlansChange: (plans: WorkplacePlan[]) => void } | { mode: 'contract'; contracts: MatchingContract[]; onContractsChange: (contracts: MatchingContract[]) => void })
const steps = ['Pay & Deductions', 'Workplace Plan', 'Employer Funding', 'CRA Limits', 'Review']
const descriptions = ['Your annual cash pay and shared personal contributions.', 'Choose each arrangement and your own contribution.', 'Enter employer funding separately from cash pay.', 'Supply independent CRA capacity values for the modeled year.', 'Review cash, retirement destinations and the estimate assumptions.']
export function RetirementEditor(props: RetirementEditorProps) {
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const reportValidity = useCallback((field: string, invalid: boolean) => setErrors(current => {
    if (current[field] === invalid || (!invalid && current[field] === undefined)) return current
    return { ...current, [field]: invalid }
  }), [])
  const { onValidityChange } = props
  useEffect(() => { onValidityChange?.(Object.values(errors).some(Boolean)) }, [errors, onValidityChange])
  const id = useId()
  const contracts = props.mode === 'contract' && Array.isArray(props.contracts) ? props.contracts : []
  const rows = props.mode === 'annual' ? props.plans : contracts.map(c => c?.plan)
  const safeRows = Array.isArray(rows) ? rows : []
  const replace = (index: number, plan: WorkplacePlan) => {
    if (props.mode === 'annual') props.onPlansChange(safeRows.map((p, i) => i === index ? plan : p))
    else props.onContractsChange(contracts.map((c, i) => i === index ? { ...c, plan } : c))
  }
  const remove = (index: number) => {
    if (props.mode === 'annual') props.onPlansChange(safeRows.filter((_, i) => i !== index))
    else props.onContractsChange(contracts.filter((_, i) => i !== index))
  }
  const add = () => {
    const plan = createWorkplacePlan('group-rrsp', crypto.randomUUID())
    if (props.mode === 'annual') props.onPlansChange([...safeRows, plan])
    else props.onContractsChange([...contracts, createMatchingContract(plan)])
  }
  const planCards = (funding: boolean) => (
    <div className="retirement-plan-list">
      {safeRows.map((plan, index) => (
        <RetirementPlanCard
          key={typeof plan?.id === 'string' ? `${plan.id}-${plan.kind}` : `invalid-${index}`}
          plan={plan}
          contract={props.mode === 'contract' ? contracts[index] : null}
          number={index + 1}
          funding={funding}
          onReplace={next => replace(index, next)}
          onContractChange={patch => {
            if (props.mode === 'contract') {
              props.onContractsChange(contracts.map((contract, i) => i === index ? { ...contract, ...patch } : contract))
            }
          }}
          onRemove={() => remove(index)}
        />
      ))}
      {!funding && <button type="button" className="retirement-button retirement-primary" onClick={add}>
        Add Workplace Plan
      </button>}
      {funding && safeRows.length === 0 && <p>No workplace funding entered. Add a plan in Workplace Plan.</p>}
    </div>
  )
  const panes = [
    props.payContent,
    planCards(false),
    planCards(true),
    <CraLimits key="cra" profile={props.profile} onChange={props.onProfileChange}
      onClear={props.onClearCraLimits} taxYear={props.taxYear} />,
    props.reviewContent,
  ]
  return (
    <RetirementValidationContext.Provider value={reportValidity}>
      <section className="retirement-workspace">
        {props.mode === 'contract' && !Array.isArray(props.contracts) && (
          <div className="retirement-notice" role="alert">
            Saved contract collection needs review. Original values:
            <pre className="retirement-raw">{JSON.stringify(props.contracts)}</pre>
            <button type="button" className="retirement-button" onClick={() => props.onContractsChange([])}>
              Clear Invalid Contract Collection
            </button>
          </div>
        )}
        <nav className="retirement-steps" aria-label="Retirement setup steps">
          {steps.map((name, index) => (
            <button key={name} type="button" aria-current={step === index ? 'step' : undefined}
              aria-controls={`${id}-panel-${index}`} onClick={() => setStep(index)}>
              <span className="retirement-step-number">{index + 1}</span><span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="retirement-body">
          <div className="retirement-panel">
            <header>
              <span className="retirement-eyebrow">Step {step + 1} of 5</span>
              <h2>{steps[step]}</h2><p>{descriptions[step]}</p>
            </header>
            {panes.map((pane, index) => (
              <div id={`${id}-panel-${index}`} key={index} hidden={step !== index}>{pane}</div>
            ))}
            {Object.values(errors).some(Boolean) && (
              <p role="alert">Some entered values need review. Correct the associated fields before using precise results.</p>
            )}
            <footer className="retirement-footer">
              <button type="button" className="retirement-button" disabled={step === 0}
                onClick={() => setStep(current => current - 1)}>Back</button>
              <span>Step {step + 1} of 5</span>
              {step < 4
                ? <button type="button" className="retirement-button retirement-primary"
                  onClick={() => setStep(current => current + 1)}>Continue</button>
                : <button type="button" className="retirement-button" onClick={() => setStep(0)}>Review Inputs</button>}
            </footer>
          </div>
          <aside className="retirement-summary">{props.summary}</aside>
        </div>
      </section>
    </RetirementValidationContext.Provider>
  )
}
