import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ForecasterTool } from './ForecasterTool'

describe('ForecasterTool source labels', () => {
  it('shows friendly auto/manual labels instead of auto:<hint>', () => {
    render(<MemoryRouter><ForecasterTool /></MemoryRouter>)
    expect(screen.getByText('Dashboard Net Worth')).toBeTruthy()
    expect(screen.getByText('Budget Average (3 Months)')).toBeTruthy()
    expect(screen.queryByText(/auto:/i)).toBeNull()
  })
})

describe('ForecasterTool comp tax controls', () => {
  it('shows the after-tax comp events toggle and caveat by default', () => {
    render(<MemoryRouter><ForecasterTool /></MemoryRouter>)
    expect(screen.getByText('After-Tax Comp Events')).toBeTruthy()
    expect(screen.getByText(/Comp events taxed at your marginal rate/i)).toBeTruthy()
  })
})
