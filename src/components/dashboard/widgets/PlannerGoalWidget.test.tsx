import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PlannerGoalWidget } from './PlannerGoalWidget'
import { usePlannerStore } from '../../../store/usePlannerStore'
import { useAccountsStore } from '../../../store/useAccountsStore'

const plannerInitial = usePlannerStore.getState()
const accountsInitial = useAccountsStore.getState()

beforeEach(() => {
  usePlannerStore.setState(plannerInitial, true)
  useAccountsStore.setState(accountsInitial, true)
})

const renderWidget = () =>
  render(
    <MemoryRouter>
      <PlannerGoalWidget />
    </MemoryRouter>,
  )

const setGoals = (goalsJson: string) => {
  usePlannerStore.setState({ inputs: { forecaster: { goalsJson } } })
}

describe('PlannerGoalWidget', () => {
  it('points at the Forecaster when there is no goal', () => {
    renderWidget()
    expect(screen.getByRole('link', { name: 'Add a goal in the Forecaster' })).toHaveAttribute(
      'href',
      '/planner/forecaster',
    )
  })

  it('shows the largest goal and progress toward it', () => {
    setGoals(JSON.stringify([{ id: 'g1', label: 'House', amount: 200000 }, { id: 'g2', label: 'Car', amount: 40000 }]))
    useAccountsStore.setState({ accounts: [{ id: 'a', name: 'Brokerage', value: 100000, type: 'investment' }] })
    renderWidget()
    expect(screen.getByText('House')).toBeInTheDocument()
    expect(screen.getByText('$100,000 of $200,000 (50%)')).toBeInTheDocument()
  })

  it('falls back to the empty state on malformed goal data instead of crashing', () => {
    setGoals('{not json')
    renderWidget()
    expect(screen.getByRole('link', { name: 'Add a goal in the Forecaster' })).toBeInTheDocument()
  })
})
