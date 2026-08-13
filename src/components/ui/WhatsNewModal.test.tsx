import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WhatsNewModal } from './WhatsNewModal'
import { setMatchMedia } from '../../test-utils/matchMedia'

describe('WhatsNewModal disclaimer link', () => {
  it('renders the disclaimer button under Made by Mishat and fires the callback', () => {
    const onOpenDisclaimer = vi.fn()
    render(<WhatsNewModal isOpen onClose={() => {}} onOpenDisclaimer={onOpenDisclaimer} />)
    fireEvent.click(screen.getByRole('button', { name: /estimates only/i }))
    expect(onOpenDisclaimer).toHaveBeenCalled()
  })
})

describe('WhatsNewModal scrim dismissal', () => {
  it('closes when the scrim is clicked (desktop)', () => {
    setMatchMedia(true)
    const onClose = vi.fn()
    const { getByTestId } = render(<WhatsNewModal isOpen onClose={onClose} onOpenDisclaimer={() => {}} />)
    fireEvent.click(getByTestId('sheet-scrim'))
    expect(onClose).toHaveBeenCalled()
  })
})


describe('WhatsNewModal older versions disclosure', () => {
  it('hides earlier series behind a collapsed disclosure', () => {
    render(<WhatsNewModal isOpen onClose={() => {}} onOpenDisclaimer={() => {}} />)
    const toggle = screen.getByRole('button', { name: /older versions/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/^\[0\.6\./)).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByText(/^\[0\.6\./).length).toBeGreaterThan(0)
  })

  it('expands the newest entry of the current series by default', () => {
    render(<WhatsNewModal isOpen onClose={() => {}} onOpenDisclaimer={() => {}} />)
    const headings = screen.getAllByRole('button').filter((b) => /^\[0\.7\./.test(b.textContent || ''))
    expect(headings[0]).toHaveAttribute('aria-expanded', 'true')
    expect(headings[1]).toHaveAttribute('aria-expanded', 'false')
  })
})
