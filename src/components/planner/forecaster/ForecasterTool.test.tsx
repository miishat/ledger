import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ForecasterTool } from './ForecasterTool'
import { usePlannerStore } from '../../../store/usePlannerStore'

// The forecaster reads/writes usePlannerStore, a persisted module singleton.
// Reset its inputs after each test so goal/setting changes don't leak into
// the next test in this file.
afterEach(() => {
  usePlannerStore.getState().resetTool('forecaster')
})

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

describe('ForecasterTool goal dates in card', () => {
  it('shows a Projected cell inside the goals card after adding a goal', () => {
    render(<MemoryRouter><ForecasterTool /></MemoryRouter>)
    const goalsTitle = screen.getByText('Goals (Net-Worth Targets)')
    const card = goalsTitle.closest('.themed-card') as HTMLElement
    const addBtn = Array.from(card.querySelectorAll('button')).find((b) => b.textContent?.includes('Add'))!
    fireEvent.click(addBtn)
    expect(card.textContent).toContain('Projected')
  })
})
