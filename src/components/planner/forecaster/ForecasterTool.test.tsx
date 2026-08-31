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
  it('hides tax controls behind the gear popover', () => {
    render(<MemoryRouter><ForecasterTool /></MemoryRouter>)
    // tax controls not in the main row anymore
    expect(screen.queryByText('Tax Comp Events')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Comp event tax settings' }))
    expect(screen.getByText('Tax Comp Events')).toBeTruthy()
    expect(screen.getByText(/Comp events taxed at your marginal rate/i)).toBeTruthy()
  })

  it('labels the tax toggle by action, with state on aria-pressed instead of baked into the label', () => {
    render(<MemoryRouter><ForecasterTool /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Comp event tax settings' }))
    const taxToggle = screen.getByRole('button', { name: 'Tax Comp Events' })
    expect(taxToggle).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(taxToggle)
    expect(taxToggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps the two primary pills in the row, labelled by action with state on aria-pressed', () => {
    render(<MemoryRouter><ForecasterTool /></MemoryRouter>)
    const compEvents = screen.getByRole('button', { name: /^Comp Events/ })
    const debtDrag = screen.getByRole('button', { name: /^Debt Drag/ })
    expect(compEvents).toHaveAttribute('aria-pressed')
    expect(debtDrag).toHaveAttribute('aria-pressed')
    expect(compEvents.textContent).not.toMatch(/\b(On|Off)$/)
    expect(debtDrag.textContent).not.toMatch(/\b(On|Off)$/)
  })
})

describe('ForecasterTool stale tax year notice', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not warn about stale tax rates today, with the settings popover left closed', () => {
    render(<MemoryRouter><ForecasterTool /></MemoryRouter>)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('warns on the main body with default settings, without opening the settings popover', () => {
    // The tax-derived figures (chart, FI Number, Coast-FI, goal dates) render
    // unconditionally on the body, so the warning has to live there too. A
    // copy that only shows up once a closed popover is opened protects
    // nothing, since compTaxEnabled and compTaxAuto both default to true.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-03-01T00:00:00Z'))
    render(<MemoryRouter><ForecasterTool /></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveTextContent(
      /These are 2026 rates\. Brackets and contribution limits have not been updated for 2027\./i,
    )
  })

  it('does not warn when the manual rate is in use, since it does not read the tables', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-03-01T00:00:00Z'))
    render(<MemoryRouter><ForecasterTool /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Comp event tax settings' }))
    fireEvent.click(screen.getByRole('button', { name: /^Marginal/ }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
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
