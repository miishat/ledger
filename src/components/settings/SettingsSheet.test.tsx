import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SettingsSheet } from './SettingsSheet'
import { resetMatchMedia, setMatchMedia } from '../../test-utils/matchMedia'

const noop = () => {}

describe('SettingsSheet', () => {
  it('renders the section cards and the about footer', () => {
    render(<SettingsSheet open onClose={noop} onOpenWhatsNew={noop} onOpenDisclaimer={noop} />)
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Market data')).toBeInTheDocument()
    expect(screen.getByText('Backup')).toBeInTheDocument()
    expect(screen.getByText('Sync')).toBeInTheDocument()
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

describe('SettingsSheet phone layout', () => {
  beforeEach(() => {
    setMatchMedia(false)
    vi.stubGlobal('Notification', { permission: 'default', requestPermission: vi.fn() })
  })
  afterEach(() => {
    resetMatchMedia()
    vi.unstubAllGlobals()
  })

  it('Reminders is a text block plus one real 44px button, centered on each other', () => {
    render(<SettingsSheet open onClose={noop} onOpenWhatsNew={noop} onOpenDisclaimer={noop} />)
    const action = screen.getByRole('button', { name: 'Enable reminders' })
    expect(action.className).toMatch(/min-h-\[44px\]/)
    // A real bordered button like the other secondary actions, not a bare text link.
    expect(action.className).toMatch(/\bborder\b/)
    expect(action.className).toMatch(/\brounded-md\b/)
    const row = screen.getByTestId('reminders-row')
    expect(row.className).toMatch(/\bitems-center\b/)
    expect(row).toContainElement(action)
  })

  it('every section card shares one padding class and has a heading', () => {
    render(<SettingsSheet open onClose={noop} onOpenWhatsNew={noop} onOpenDisclaimer={noop} />)
    const sections = Array.from(document.querySelectorAll('section'))
    expect(sections).toHaveLength(5)
    for (const s of sections) {
      expect(s.className).toBe(sections[0].className)
      expect(s.className).toMatch(/\bp-3\b/)
      expect(s.querySelector('h3')).not.toBeNull()
    }
  })

  it('the full-width actions share the Reminders action height, radius and border', () => {
    render(<SettingsSheet open onClose={noop} onOpenWhatsNew={noop} onOpenDisclaimer={noop} />)
    const reference = screen.getByRole('button', { name: 'Enable reminders' }).className
    for (const name of ['Load demo data', 'Save client ID']) {
      const cls = screen.getByRole('button', { name }).className
      for (const token of ['min-h-[44px]', 'rounded-md', 'border', 'border-border', 'px-3']) {
        expect(cls.split(/\s+/)).toContain(token)
        expect(reference.split(/\s+/)).toContain(token)
      }
    }
  })

  it('Save client ID reads as disabled without dropping below readable contrast', () => {
    render(<SettingsSheet open onClose={noop} onOpenWhatsNew={noop} onOpenDisclaimer={noop} />)
    const save = screen.getByRole('button', { name: 'Save client ID' })
    expect(save).toBeDisabled()
    expect(save.className).toMatch(/disabled:border-dashed/)
    expect(save.className).toMatch(/disabled:opacity-70/)
  })

  it('has no visible phone title but keeps its accessible name', () => {
    render(<SettingsSheet open onClose={noop} onOpenWhatsNew={noop} onOpenDisclaimer={noop} />)
    // The desktop-only heading stays in the DOM (hidden by CSS); the phone header has none.
    expect(screen.getByTestId('sheet-header').querySelector('h2')).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  })

  it('every section leads with a one-line description on phones, none on desktop', () => {
    const { unmount } = render(<SettingsSheet open onClose={noop} onOpenWhatsNew={noop} onOpenDisclaimer={noop} />)
    expect(screen.getByText('Pick a theme for the whole app.')).toBeInTheDocument()
    expect(screen.getByText('Save, restore or try sample data.')).toBeInTheDocument()
    unmount()
    setMatchMedia(true)
    render(<SettingsSheet open onClose={noop} onOpenWhatsNew={noop} onOpenDisclaimer={noop} />)
    expect(screen.queryByText('Pick a theme for the whole app.')).toBeNull()
    expect(screen.getByRole('button', { name: 'Enable reminders' }).className).toMatch(/text-accent/)
  })
})
