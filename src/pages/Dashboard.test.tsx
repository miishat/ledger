import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { setMatchMedia, resetMatchMedia } from '../test-utils/matchMedia'
import { Dashboard, DASHBOARD_WIDGET_LABELS, DASHBOARD_WIDGET_IDS } from './Dashboard'
import { useDashboardLayoutStore } from '../store/useDashboardLayoutStore'

afterEach(() => resetMatchMedia())

describe('Dashboard widget drag gating', () => {
  it('does not mark widgets draggable on mobile', () => {
    setMatchMedia(false) // mobile: useIsDesktop() === false
    const { container } = render(<MemoryRouter><Dashboard /></MemoryRouter>)
    const draggables = container.querySelectorAll('[draggable="true"]')
    expect(draggables.length).toBe(0)
  })

  it('marks widgets draggable on desktop', () => {
    setMatchMedia(true) // desktop
    const { container } = render(<MemoryRouter><Dashboard /></MemoryRouter>)
    const draggables = container.querySelectorAll('[draggable="true"]')
    expect(draggables.length).toBeGreaterThan(0)
  })

  it('does not render a widget the user has switched off', () => {
    useDashboardLayoutStore.setState({ order: [], hidden: ['top-goal'] })
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.queryByText('Top Goal')).toBeNull()
  })

  it('has a label for every widget id it renders', () => {
    expect(Object.keys(DASHBOARD_WIDGET_LABELS).sort()).toEqual([...DASHBOARD_WIDGET_IDS].sort())
  })
})
