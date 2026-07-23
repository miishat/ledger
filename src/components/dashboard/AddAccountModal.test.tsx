import { describe, expect, it, vi, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { setMatchMedia, resetMatchMedia } from '../../test-utils/matchMedia'
import { AddAccountModal } from './AddAccountModal'

describe('AddAccountModal', () => {
  it('renders when open and closes via scrim', () => {
    setMatchMedia(true)
    const onClose = vi.fn()
    const { getByTestId } = render(<AddAccountModal isOpen onClose={onClose} />)
    expect(getByTestId('sheet-panel')).toBeInTheDocument()
    fireEvent.click(getByTestId('sheet-scrim'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('AddAccountModal mobile header (no double close)', () => {
  afterEach(() => resetMatchMedia())

  it('shows one close control on mobile and hides its own header there', () => {
    setMatchMedia(false)
    render(<AddAccountModal isOpen onClose={() => {}} defaultType="bank" editingAccount={null} />)
    // the modal's own header row is desktop-only. Sheet renders via createPortal
    // to document.body, so query there rather than RTL's pre-portal `container`.
    const ownHeader = document.body.querySelector('.border-b')
    expect(ownHeader?.className).toMatch(/\bhidden\b/)
    expect(ownHeader?.className).toMatch(/md:flex/)
    // jsdom fallback: no stylesheet is loaded in tests, so Tailwind's `hidden`
    // class has no visibility effect here and both Close buttons render in the
    // DOM. We already assert the gating class above, so scope the "one close
    // control" check to buttons outside the desktop-gated header, matching
    // what a real mobile browser renders.
    const closeButtons = screen
      .getAllByRole('button', { name: 'Close' })
      .filter((btn) => !ownHeader?.contains(btn))
    expect(closeButtons).toHaveLength(1)
  })
})
