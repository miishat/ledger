import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WhatsNewModal } from './WhatsNewModal'

describe('WhatsNewModal disclaimer link', () => {
  it('renders the disclaimer button under Made by Mishat and fires the callback', () => {
    const onOpenDisclaimer = vi.fn()
    render(<WhatsNewModal isOpen onClose={() => {}} onOpenDisclaimer={onOpenDisclaimer} />)
    fireEvent.click(screen.getByRole('button', { name: /estimates only/i }))
    expect(onOpenDisclaimer).toHaveBeenCalled()
  })

  it('blurs the backdrop', () => {
    render(<WhatsNewModal isOpen onClose={() => {}} onOpenDisclaimer={() => {}} />)
    expect(screen.getByRole('dialog').className).toContain('backdrop-blur')
  })
})
