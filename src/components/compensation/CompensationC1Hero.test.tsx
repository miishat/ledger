import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CompHeroWidget } from './CompHeroWidget'
import { useCompensationStore, defaultPrimaryPackage } from '../../store/useCompensationStore'
import { usePlannerStore } from '../../store/usePlannerStore'
import { createMatchingContract, createSharedTaxProfile, createWorkplacePlan } from '../../utils/finance/retirementTypes'
beforeEach(() => {
  useCompensationStore.setState({ primaryPackage: { ...defaultPrimaryPackage, baseSalary: 100000, cashBonusPercent: 0, esppContributionPercent: 0, rsuGrants: [], retirement: { schemaVersion: 1, contracts: [], review: { status: 'ready', issues: [] } } }, showAfterTax: false, timeMode: 'current-year' })
  usePlannerStore.setState({ sharedTaxProfile: createSharedTaxProfile(), salaryRetirementScenario: null, inputs: {} })
})
it('uses cash after actual contributions and withholds the old scalar transfer', () => {
  const contract = createMatchingContract({ ...createWorkplacePlan('dc-rpp'), employerContribution: 3000 })
  contract.employee.value = 5000
  contract.unconditionalEmployer.value = 3000
  useCompensationStore.getState().setRetirementContracts('primary', [contract])
  render(<MemoryRouter><CompHeroWidget /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'After-Tax' }))
  expect(screen.getByText('Cash After Contributions')).toBeInTheDocument()
  expect(screen.getByText('Employee Cash Outflow: $5,000')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /full breakdown/i })).toBeDisabled()
})
it('labels known compensation while employer DB funding is unknown', () => {
  useCompensationStore.getState().setRetirementContracts('primary', [createMatchingContract(createWorkplacePlan('db-rpp'))])
  render(<MemoryRouter><CompHeroWidget /></MemoryRouter>)
  expect(screen.getByText('Known Annual Compensation')).toBeInTheDocument()
  expect(screen.getByText(/Employer Pension Funding Unknown/)).toBeInTheDocument()
})
it('withholds chart amounts while a live draft is invalid', () => {
  render(<MemoryRouter><CompHeroWidget blocked /></MemoryRouter>)
  expect(screen.queryByRole('img', { name: /total annual compensation/i })).not.toBeInTheDocument()
  expect(screen.queryByText('$100,000')).not.toBeInTheDocument()
})
it('withholds fallback details when a draft is invalid and benefits need review', () => {
  useCompensationStore.getState().setPrimaryPackage({ rrspMatchPercent: 5, rrspMatchCap: 4000, retirement: undefined })
  render(<MemoryRouter><CompHeroWidget blocked /></MemoryRouter>)
  expect(screen.queryByText('$100,000')).not.toBeInTheDocument()
  expect(screen.getAllByText('Needs Review')).toHaveLength(3)
})
it.each([[0, 3000, null, 3000], [5000, 3000, 0, 0], [5000, 3000, 6000, 6000]])('counts employer funding once with employee %s, unconditional %s and cap %s', (employee, unconditional, cap, expected) => {
  const contract = createMatchingContract(createWorkplacePlan('dc-rpp'))
  contract.employee.value = employee
  contract.unconditionalEmployer.value = unconditional
  contract.employerAnnualCap = cap
  contract.tiers = [{ lowerPercent: 0, upperPercent: 5, matchRatio: 1 }]
  useCompensationStore.getState().setRetirementContracts('primary', [contract])
  render(<MemoryRouter><CompHeroWidget /></MemoryRouter>)
  expect(document.querySelector('[data-key-figure]')).toHaveTextContent(new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(100000 + expected))
  expect(screen.getByText(`Employee Cash Outflow: $${employee.toLocaleString('en-CA')}`)).toBeInTheDocument()
})
