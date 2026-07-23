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

  it('gives the month arrows >=44px hit areas', () => {
    renderBudget()
    for (const label of ['Previous Month', 'Next Month']) {
      const btn = screen.getByLabelText(label)
      const classes = btn.className.split(/\s+/)
      expect(classes).toContain('min-h-[44px]')
      expect(classes).toContain('min-w-[44px]')
    }
  })
})
