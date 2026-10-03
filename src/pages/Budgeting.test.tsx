import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { Budgeting } from './Budgeting'
import { resetMatchMedia, setMatchMedia } from '../test-utils/matchMedia'

function renderBudget() {
  return render(<MemoryRouter><Budgeting /></MemoryRouter>)
}

describe('Budgeting header (mobile de-duplication)', () => {
  afterEach(resetMatchMedia)

  it('labels the period dropdown for screen readers', () => {
    renderBudget()
    // ThemedSelect trigger exposes aria-label as its accessible name
    expect(screen.getByRole('button', { name: 'Time period' })).toBeInTheDocument()
  })

  it('renders the range dropdown on desktop only so a phone shows one month control', () => {
    renderBudget()
    expect(screen.getByRole('button', { name: 'Time period' }).closest('[data-period-dropdown]')).toBeTruthy()
    cleanup()
    setMatchMedia(false)
    renderBudget()
    expect(screen.queryByRole('button', { name: 'Time period' })).toBeNull()
  })

  // The arrows keep a 44px touch target at the mobile base width and shrink
  // only from md up, where the row has to line up with the 40px-tall select
  // and the Import CSV / Add Transaction buttons beside it.
  it('gives the month arrows 44px hit areas on mobile and 32px from md up', () => {
    renderBudget()
    for (const label of ['Previous Month', 'Next Month']) {
      const btn = screen.getByLabelText(label)
      const classes = btn.className.split(/\s+/)
      expect(classes).toContain('h-11')
      expect(classes).toContain('w-11')
      expect(classes).toContain('md:h-8')
      expect(classes).toContain('md:w-8')
    }
  })

  it('matches the header controls to a single 40px height from md up', () => {
    renderBudget()
    expect(screen.getByLabelText('Time period').className).toMatch(/\bh-10\b/)
    expect(screen.getByLabelText('Import CSV').className).toMatch(/\bh-10\b/)
    expect(screen.getByRole('button', { name: 'Add Transaction' }).className).toMatch(/\bh-10\b/)
  })
})

describe('Budgeting header on a phone', () => {
  afterEach(() => resetMatchMedia())

  it('moves Add Transaction to the top bar and the month and import controls into one row', () => {
    setMatchMedia(false)
    render(<MemoryRouter><Budgeting /></MemoryRouter>)
    expect(screen.getAllByRole('button', { name: 'Add Transaction' })).toHaveLength(1)
    const row = screen.getByTestId('budget-phone-controls')
    expect(row.querySelector('button[aria-label="Previous Month"]')).not.toBeNull()
    expect(row.querySelector('button[aria-label="Import CSV"]')).not.toBeNull()
    expect(screen.queryByText('Manage your income, track expenses, and view your cash flow.')).toBeNull()
  })

  it('keeps the desktop header as it was', () => {
    render(<MemoryRouter><Budgeting /></MemoryRouter>)
    expect(screen.queryByTestId('budget-phone-controls')).toBeNull()
    expect(screen.getAllByRole('button', { name: 'Add Transaction' })).toHaveLength(1)
    expect(screen.getByText('Manage your income, track expenses, and view your cash flow.')).toBeInTheDocument()
  })
})
