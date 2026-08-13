import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Budgeting } from './Budgeting'

function renderBudget() {
  return render(<MemoryRouter><Budgeting /></MemoryRouter>)
}

describe('Budgeting header (mobile de-duplication)', () => {
  it('labels the period dropdown for screen readers', () => {
    renderBudget()
    // ThemedSelect trigger exposes aria-label as its accessible name
    expect(screen.getByRole('button', { name: 'Time period' })).toBeInTheDocument()
  })

  it('hides the range dropdown below md so only one month control shows on mobile', () => {
    renderBudget()
    const trigger = screen.getByRole('button', { name: 'Time period' })
    // the dropdown wrapper is hidden on mobile, shown from md up
    const wrapper = trigger.closest('[data-period-dropdown]') as HTMLElement
    expect(wrapper).toBeTruthy()
    expect(wrapper.className).toMatch(/hidden/)
    expect(wrapper.className).toMatch(/md:block/)
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
