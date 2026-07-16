import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SettingsSheet } from './SettingsSheet'

const noop = () => {}

describe('SettingsSheet', () => {
  it('renders the three section cards and the about footer', () => {
    render(<SettingsSheet open onClose={noop} onOpenWhatsNew={noop} onOpenDisclaimer={noop} />)
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Market data')).toBeInTheDocument()
    expect(screen.getByText('Backup')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /What's New/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Not financial advice/ })).toBeInTheDocument()
  })

  it('about footer buttons close the sheet and open their modals', () => {
    const onClose = vi.fn()
    const onOpenWhatsNew = vi.fn()
    const onOpenDisclaimer = vi.fn()
    render(<SettingsSheet open onClose={onClose} onOpenWhatsNew={onOpenWhatsNew} onOpenDisclaimer={onOpenDisclaimer} />)
    fireEvent.click(screen.getByRole('button', { name: /What's New/ }))
    expect(onClose).toHaveBeenCalled()
    expect(onOpenWhatsNew).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Not financial advice/ }))
    expect(onOpenDisclaimer).toHaveBeenCalled()
  })
})
