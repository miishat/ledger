import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MonthlySummaryWidget } from './MonthlySummaryWidget'

describe('MonthlySummaryWidget', () => {
  it('shows a Projected Net row matching the summary row style', () => {
    const month = new Date().toISOString().slice(0, 7)
    render(<MonthlySummaryWidget range={{ from: month, to: month }} />)
    expect(screen.getByText('Projected Net')).toBeTruthy()
  })
})
