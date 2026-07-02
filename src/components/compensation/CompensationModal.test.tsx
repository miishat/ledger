import { render, screen, fireEvent } from '@testing-library/react'
import { CompensationModal } from './CompensationModal'
import { useCompensationStore } from '../../store/useCompensationStore'

const initialCompState = useCompensationStore.getState()

beforeEach(() => {
  localStorage.clear()
  useCompensationStore.setState(initialCompState, true)
})

describe('CompensationModal ticker field', () => {
  it('saves an uppercased, trimmed ticker on submit', () => {
    render(<CompensationModal isOpen={true} onClose={() => {}} />)
    const tickerInput = screen.getByLabelText(/ticker/i)
    fireEvent.change(tickerInput, { target: { value: ' aapl ' } })
    fireEvent.click(screen.getByRole('button', { name: /save compensation package/i }))
    expect(useCompensationStore.getState().primaryPackage.companyTicker).toBe('AAPL')
  })
})
