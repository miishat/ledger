import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { setMatchMedia, resetMatchMedia } from '../test-utils/matchMedia'
import { Dashboard } from './Dashboard'

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
})
