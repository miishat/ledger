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
