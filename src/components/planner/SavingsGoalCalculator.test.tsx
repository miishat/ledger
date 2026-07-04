import { fireEvent, render, screen } from '@testing-library/react'
import { usePlannerStore } from '../../store/usePlannerStore'
import { SavingsGoalCalculator } from './SavingsGoalCalculator'

const initialState = usePlannerStore.getState()
beforeEach(() => {
  localStorage.clear()
  usePlannerStore.setState(initialState, true)
})

describe('SavingsGoalCalculator', () => {
  it('defaults to solving for the monthly contribution and hides that input', () => {
    render(<SavingsGoalCalculator />)
    expect(screen.getByLabelText('Solve for')).toHaveValue('monthly')
    expect(screen.getByText('Monthly contribution needed')).toBeInTheDocument()
    expect(screen.queryByLabelText('Monthly contribution')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Goal amount')).toBeInTheDocument()
  })

  it('solves months and formats as years + months', () => {
    render(<SavingsGoalCalculator />)
    fireEvent.change(screen.getByLabelText('Solve for'), { target: { value: 'months' } })
    fireEvent.change(screen.getByLabelText('Goal amount'), { target: { value: '2200' } })
    fireEvent.change(screen.getByLabelText('Starting amount'), { target: { value: '1000' } })
    fireEvent.change(screen.getByLabelText('Annual return'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Monthly contribution'), { target: { value: '100' } })
    // solveMonths(2200, 1000, 0, 100) === 12
    expect(screen.getByText('1y 0m')).toBeInTheDocument()
  })

  it('shows "Not reachable" when the goal cannot be met', () => {
    render(<SavingsGoalCalculator />)
    fireEvent.change(screen.getByLabelText('Solve for'), { target: { value: 'months' } })
    fireEvent.change(screen.getByLabelText('Goal amount'), { target: { value: '999999999999' } })
    fireEvent.change(screen.getByLabelText('Starting amount'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Annual return'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Monthly contribution'), { target: { value: '1' } })
    expect(screen.getByText('Not reachable')).toBeInTheDocument()
  })

  it('persists the solve-for selection', () => {
    render(<SavingsGoalCalculator />)
    fireEvent.change(screen.getByLabelText('Solve for'), { target: { value: 'rate' } })
    expect(usePlannerStore.getState().inputs['savings-goal'].solveFor).toBe('rate')
  })
})
