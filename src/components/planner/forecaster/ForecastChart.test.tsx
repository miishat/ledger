import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForecastChart } from './ForecastChart'
import { buildForecast } from '../../../utils/finance/forecast'

const points = buildForecast({
  startBalance: 100000,
  monthlySavings: 1000,
  annualReturnPct: 7,
  annualInflationPct: 2.5,
  contributionStepUpPct: 0,
  years: 2,
  scenarioSpreadPct: 2,
})

describe('ForecastChart legend', () => {
  it('line view legend names projected, band and actual', () => {
    render(<ForecastChart points={points} history={[]} showReal={false} view="line" goalMarkers={[]} />)
    expect(screen.getByText('Projected')).toBeInTheDocument()
    expect(screen.getByText(/Conservative to Optimistic/i)).toBeInTheDocument()
    expect(screen.getByText('Actual')).toBeInTheDocument()
  })

  it('stacked view legend names contributed and growth', () => {
    render(<ForecastChart points={points} history={[]} showReal={false} view="stacked" goalMarkers={[]} />)
    expect(screen.getByText('Contributed')).toBeInTheDocument()
    expect(screen.getByText('Growth')).toBeInTheDocument()
  })

  it('real mode legend labels the projected line as real', () => {
    render(<ForecastChart points={points} history={[]} showReal view="line" goalMarkers={[]} />)
    expect(screen.getByText('Projected (real)')).toBeInTheDocument()
  })
})

describe('ForecastChart goal names', () => {
  const goals = [{ label: 'Initial Milestone', month: 6, amount: 106000 }, { label: 'Out of Reach', month: null, amount: 9e9 }]

  it('names each reachable goal in the legend on a phone, not on the chart', () => {
    render(<ForecastChart centered points={points} history={[]} showReal={false} view="line" goalMarkers={goals} />)
    expect(screen.getByText('Goal: Initial Milestone')).toBeInTheDocument()
    expect(screen.queryByText('Goal: Out of Reach')).toBeNull()
    expect(document.querySelector('.recharts-reference-line text')).toBeNull()
  })

  it('keeps the goal name off the legend on desktop, where it is labelled on the line', () => {
    render(<ForecastChart points={points} history={[]} showReal={false} view="line" goalMarkers={goals} />)
    expect(screen.queryByText('Goal: Initial Milestone')).toBeNull()
  })
})
