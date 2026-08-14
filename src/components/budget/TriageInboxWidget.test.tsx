import { render, screen } from '@testing-library/react'
import { TriageInboxWidget } from './TriageInboxWidget'
import { useTriageStore } from '../../store/useTriageStore'
import { useBudgetStore } from '../../store/useBudgetStore'

const triageInitial = useTriageStore.getState()
const budgetInitial = useBudgetStore.getState()

beforeEach(() => {
  useTriageStore.setState(triageInitial, true)
  useBudgetStore.setState(budgetInitial, true)
})

describe('TriageInboxWidget', () => {
  it('renders nothing when the inbox is empty', () => {
    const { container } = render(<TriageInboxWidget />)
    expect(container).toBeEmptyDOMElement()
  })

  it('counts the pending transactions in its title', () => {
    useTriageStore.getState().addPending([
      { id: 'p1', date: '2026-08-01', amount: 12, description: 'NETFLIX', type: 'expense' },
      { id: 'p2', date: '2026-08-02', amount: 30, description: 'HYDRO', type: 'expense' },
    ])
    render(<TriageInboxWidget />)
    expect(screen.getByText('Triage Inbox (2)')).toBeInTheDocument()
  })

  it('lists each pending description', () => {
    useTriageStore.getState().addPending([
      { id: 'p1', date: '2026-08-01', amount: 12, description: 'NETFLIX', type: 'expense' },
    ])
    render(<TriageInboxWidget />)
    expect(screen.getByText('NETFLIX')).toBeInTheDocument()
  })
})
