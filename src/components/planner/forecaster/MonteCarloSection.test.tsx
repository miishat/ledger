import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MonteCarloSection } from './MonteCarloSection'

const baseProps = {
  startBalance: 100000,
  monthlySavings: 2000,
  years: 10,
  meanReturnPct: 7,
  stdDevPct: 15,
  stepUpPct: 2,
  lumpSums: [],
  target: 1000000,
  onStdDevChange: () => {},
}

describe('MonteCarloSection layout', () => {
  it('keeps the footnote inside the auto-height card (no fixed card height)', () => {
    render(<MonteCarloSection {...baseProps} />)
    const note = screen.getByText(/500 seeded simulations/i)
    const card = note.closest('.themed-card') as HTMLElement
    expect(card).toBeTruthy()
    expect(card.className).not.toMatch(/h-\[300px\]/)
    const chartWrapper = card.querySelector('.h-\\[300px\\]')
    expect(chartWrapper).toBeTruthy()
  })
})
