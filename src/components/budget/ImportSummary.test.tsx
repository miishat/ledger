import { fireEvent, render, screen } from '@testing-library/react'
import { ImportSummary } from './ImportSummary'
import { useTriageStore } from '../../store/useTriageStore'
import { useBudgetStore } from '../../store/useBudgetStore'

const initial = useTriageStore.getState()
beforeEach(() => {
  useTriageStore.setState(initial, true)
  useBudgetStore.setState({ transactions: {} })
})

it('shows skipped counts and restores an ignored original through View skipped', () => {
  const store = useTriageStore.getState()
  const sourceId = store.createImportSource('Card A')
  const row = { id: 'a', date: '2026-06-10', amount: 5, description: 'Coffee', type: 'expense' as const }
  store.importTransactions([row], sourceId)
  store.rejectTransaction('a')
  store.importTransactions([{ ...row, id: 'b' }], sourceId)
  render(<ImportSummary />)
  expect(screen.getByRole('status')).toHaveTextContent('1 previously handled transaction skipped')
  fireEvent.click(screen.getByText(/View skipped/))
  expect(screen.getByText(/Card A/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Review again' }))
  expect(useTriageStore.getState().pendingTransactions.a).toBeDefined()
})
