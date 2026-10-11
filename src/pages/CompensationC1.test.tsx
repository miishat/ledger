import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Compensation } from './Compensation'
import { useCompensationStore, defaultPrimaryPackage } from '../store/useCompensationStore'
import { createMatchingContract, createWorkplacePlan } from '../utils/finance/retirementTypes'
it('renders the real C1 workspace before package charts', () => {
  useCompensationStore.setState({ primaryPackage: { ...defaultPrimaryPackage, baseSalary: 100000, retirement: { schemaVersion: 1, contracts: [], review: { status: 'ready', issues: [] } } } })
  render(<MemoryRouter><Compensation /></MemoryRouter>)
  const workspace = screen.getByRole('region', { name: 'Compensation Benefits Workspace' })
  const charts = screen.getByRole('heading', { name: 'Total Compensation', level: 2 })
  expect(workspace.compareDocumentPosition(charts) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
it('treats an employer-funded package without cash salary as populated', () => {
  const contract = createMatchingContract(createWorkplacePlan('dc-rpp'))
  contract.unconditionalEmployer.value = 3000
  useCompensationStore.setState({ primaryPackage: { ...defaultPrimaryPackage, baseSalary: 0, retirement: { schemaVersion: 1, contracts: [contract], review: { status: 'ready', issues: [] } } } })
  render(<MemoryRouter><Compensation /></MemoryRouter>)
  expect(screen.getByRole('button', { name: 'Edit Package' })).toBeInTheDocument()
  expect(screen.queryByText('No compensation data added yet. Start by adding your current offer or current package.')).not.toBeInTheDocument()
})
