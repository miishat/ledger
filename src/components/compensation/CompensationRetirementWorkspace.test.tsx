import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CompensationRetirementWorkspace } from './CompensationRetirementWorkspace'
import { useCompensationStore, defaultPrimaryPackage } from '../../store/useCompensationStore'
import { usePlannerStore } from '../../store/usePlannerStore'
import { createMatchingContract, createSharedTaxProfile, createWorkplacePlan } from '../../utils/finance/retirementTypes'
beforeEach(() => {
  useCompensationStore.setState({ primaryPackage: { ...defaultPrimaryPackage, baseSalary: 100000, cashBonusPercent: 0, esppContributionPercent: 0, rsuGrants: [], retirement: { schemaVersion: 1, contracts: [], review: { status: 'ready', issues: [] } } }, includePersonalDeductions: false })
  usePlannerStore.setState({ sharedTaxProfile: createSharedTaxProfile(), salaryRetirementScenario: null, inputs: {} })
})
it('puts the five-step benefits editor in the workspace and saves independent primary contracts', () => {
  render(<CompensationRetirementWorkspace />)
  expect(screen.getByRole('navigation', { name: 'Retirement setup steps' })).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: 'Include Personal Deductions' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /2Workplace Plan/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Add Workplace Plan' }))
  expect(useCompensationStore.getState().primaryPackage.retirement?.contracts).toHaveLength(1)
})
it('keeps legacy estimates explicit until reviewed actual terms replace them', () => {
  useCompensationStore.setState({ primaryPackage: { ...defaultPrimaryPackage, baseSalary: 100000, rrspMatchPercent: 5, rrspMatchCap: 4000, retirement: undefined } })
  render(<CompensationRetirementWorkspace />)
  expect(screen.getByText('Legacy Benefits Need Review')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Enter Actual Plan Terms' }))
  expect(useCompensationStore.getState().primaryPackage.retirement?.review.status).toBe('ready')
})
it('shows unknown pension funding rather than a precise compensation total', () => {
  useCompensationStore.getState().setRetirementContracts('primary', [createMatchingContract(createWorkplacePlan('db-rpp'))])
  render(<CompensationRetirementWorkspace />)
  expect(screen.getByText('Known Compensation')).toBeInTheDocument()
  expect(screen.getByText(/Pension Funding Unknown/)).toBeInTheDocument()
})
it('withholds the summary and reports malformed pay drafts without overwriting saved pay', async () => {
  const validity = vi.fn()
  render(<CompensationRetirementWorkspace onValidityChange={validity} />)
  fireEvent.change(screen.getByLabelText('Annual Base Salary (CAD)'), { target: { value: '-5' } })
  await waitFor(() => expect(validity).toHaveBeenLastCalledWith(true))
  expect(useCompensationStore.getState().primaryPackage.baseSalary).toBe(100000)
  expect(screen.getAllByText('Needs Review').length).toBeGreaterThan(0)
})
it('edits the province in the shared tax profile', () => {
  render(<CompensationRetirementWorkspace />)
  fireEvent.change(screen.getByLabelText('Province'), { target: { value: 'BC' } })
  expect(usePlannerStore.getState().sharedTaxProfile.province).toBe('BC')
})
