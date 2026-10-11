import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { RetirementEditor } from './RetirementEditor'
import { createMatchingContract, createSharedTaxProfile, createWorkplacePlan, type MatchingContract } from '../../utils/finance/retirementTypes'
import { resolveMatchingPlan } from '../../utils/finance/retirementMatching'

function Harness({ initial = [createMatchingContract(createWorkplacePlan('group-rrsp', 'a'))] }: { initial?: MatchingContract[] }) {
  const [contracts, setContracts] = useState(initial)
  const [invalid, setInvalid] = useState(false)
  const results = Array.isArray(contracts) ? contracts.map(c => resolveMatchingPlan(c, { baseSalary: 100000, cashBonus: 20000 })) : []
  return <RetirementEditor mode="contract" contracts={contracts} onContractsChange={next => setContracts(structuredClone(next))} profile={createSharedTaxProfile()} onProfileChange={() => {}} onClearCraLimits={() => {}} payContent={<p>Pay input</p>} reviewContent={<p>Review</p>} summary={<><p>Funding: {invalid ? 'Needs Review' : results.map(r => r.plan?.employerContribution ?? 'Invalid').join(', ')}</p><p>Employee: {results.map(r => r.plan?.employeeContribution ?? 'Invalid').join(', ')}</p></>} onValidityChange={setInvalid} />
}
const step = (name: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
describe('Shared contractual editor', () => {
  it('edits participation-sensitive matching, zero cap and null cap distinctly', () => {
    render(<Harness />); step('Workplace Plan')
    fireEvent.change(screen.getByLabelText('Employee Contribution Basis'), { target: { value: 'percent' } })
    fireEvent.change(screen.getByLabelText('Employee Contribution Percent'), { target: { value: '6' } })
    step('Employer Funding'); fireEvent.click(screen.getByRole('button', { name: 'Add Matching Tier' }))
    fireEvent.change(screen.getByLabelText('Tier 1 Match Up To Percent'), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText('Tier 1 Employer Match Rate'), { target: { value: '0.5' } })
    expect(screen.getByText('Funding: 3000')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('No Annual Cap')); expect(screen.getByText('Funding: 0')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Annual Employer Cap'), { target: { value: '2000.25' } })
    expect(screen.getByText('Funding: 2000.25')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('No Annual Cap')); expect(screen.getByText('Funding: 3000')).toBeInTheDocument()
  })
  it('keeps multiple contracts independent with explicit bonus eligibility and override', () => {
    render(<Harness initial={[createMatchingContract(createWorkplacePlan('prpp', 'a')), createMatchingContract(createWorkplacePlan('vrsp', 'b'))]} />); step('Workplace Plan')
    const bases = screen.getAllByLabelText('Eligible Earnings')
    fireEvent.change(bases[0], { target: { value: 'base-plus-bonus' } })
    fireEvent.change(screen.getAllByLabelText('Employee Contribution Basis')[0], { target: { value: 'percent' } })
    fireEvent.change(screen.getByLabelText('Employee Contribution Percent'), { target: { value: '5' } })
    fireEvent.change(bases[1], { target: { value: 'override' } })
    fireEvent.change(screen.getByLabelText('Eligible Earnings Override'), { target: { value: '90000.55' } })
    step('Employer Funding')
    fireEvent.change(screen.getAllByLabelText('Unconditional Employer Contribution')[0], { target: { value: '1000.15' } })
    expect(screen.getByText('Funding: 1000.15, 0')).toBeInTheDocument()
    expect(screen.getAllByLabelText(/Member Direction Confirmed/)).toHaveLength(2)
  })
  it('removes a malformed raw contract without crashing', () => {
    render(<Harness initial={null as unknown as MatchingContract[]} />)
    expect(screen.getByText(/Saved contract collection needs review/)).toBeInTheDocument()
  })
  it('repairs malformed contribution objects before presenting editable fields', () => {
    render(<Harness initial={[{ ...createMatchingContract(createWorkplacePlan('dc-rpp', 'a')), employee: null } as unknown as MatchingContract]} />)
    step('Workplace Plan')
    expect(screen.getByRole('button', { name: 'Repair Matching Terms for Plan 1' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Repair Matching Terms for Plan 1' }))
    expect(screen.getByLabelText('Employee Annual Contribution')).toHaveValue('0')
  })
  it('clears invalid draft blockage when the affected plan is removed', () => {
    render(<Harness />); step('Workplace Plan')
    fireEvent.change(screen.getByLabelText('Employee Annual Contribution'), { target: { value: '-5' } })
    expect(screen.getByText('Funding: Needs Review')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove Plan 1' }))
    expect(screen.queryByText('Funding: Needs Review')).not.toBeInTheDocument()
  })
  it('retains a later plan invalid draft when an earlier valid plan is removed', () => {
    render(<Harness initial={[createMatchingContract(createWorkplacePlan('prpp', 'a')), createMatchingContract(createWorkplacePlan('prpp', 'b'))]} />)
    step('Workplace Plan')
    fireEvent.change(screen.getAllByLabelText('Employee Annual Contribution')[1], { target: { value: 'bad contribution' } })
    fireEvent.click(screen.getByRole('button', { name: 'Remove Plan 1' }))
    expect(screen.getByLabelText('Employee Annual Contribution')).toHaveValue('bad contribution')
    expect(screen.getByText('Funding: Needs Review')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Employee Annual Contribution'), { target: { value: '987.65' } })
    expect(screen.getByText('Employee: 987.65')).toBeInTheDocument()
    expect(screen.getByText('Funding: 0')).toBeInTheDocument()
  })
  it.each([false, true])('retains later invalid tier drafts across earlier removal with saved identifiers %s', savedIds => {
    const contract = { ...createMatchingContract(), employee: { mode: 'dollars' as const, value: 6000 }, tiers: [
      { ...(savedIds ? { id: 'first' } : {}), lowerPercent: 0, upperPercent: 3, matchRatio: 1 },
      { ...(savedIds ? { id: 'second' } : {}), lowerPercent: 3, upperPercent: 6, matchRatio: .5 },
    ] }
    render(<Harness initial={[contract]} />); step('Employer Funding')
    fireEvent.change(screen.getByLabelText('Tier 2 Employer Match Rate'), { target: { value: 'bad match' } })
    fireEvent.click(screen.getByRole('button', { name: 'Remove Tier 1' }))
    expect(screen.getByLabelText('Tier 1 Employer Match Rate')).toHaveValue('bad match')
    expect(screen.getByText('Funding: Needs Review')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Tier 1 Employer Match Rate'), { target: { value: '0.75' } })
    expect(screen.getByText('Funding: 2250')).toBeInTheDocument()
    expect(screen.getByText('Employee: 6000')).toBeInTheDocument()
  })
})
