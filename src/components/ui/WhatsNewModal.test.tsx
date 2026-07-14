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
