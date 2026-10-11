import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Compensation } from './Compensation'
import { useCompensationStore, defaultPrimaryPackage } from '../store/useCompensationStore'
it('renders the real C1 workspace before package charts', () => {
  useCompensationStore.setState({ primaryPackage: { ...defaultPrimaryPackage, baseSalary: 100000, retirement: { schemaVersion: 1, contracts: [], review: { status: 'ready', issues: [] } } } })
  render(<MemoryRouter><Compensation /></MemoryRouter>)
  const workspace = screen.getByRole('region', { name: 'Compensation Benefits Workspace' })
  const charts = screen.getByRole('heading', { name: 'Total Compensation', level: 2 })
  expect(workspace.compareDocumentPosition(charts) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
