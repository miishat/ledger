import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeBackground } from './ThemeBackground'

describe('ThemeBackground', () => {
  it.each(['geometric', 'tactical', 'luxury'] as const)('draws nothing for %s', (theme) => {
    const { container } = render(<ThemeBackground theme={theme} />)
    expect(container).toBeEmptyDOMElement()
  })

  it.each(['aurora', 'glass', 'nouveau'] as const)('draws a fixed decoration layer for %s', (theme) => {
    const { container } = render(<ThemeBackground theme={theme} />)
    const root = container.firstElementChild!
    expect(root).not.toBeNull()
    expect(root.className).toMatch(/fixed/)
    expect(root.className).toMatch(/pointer-events-none/)
  })

  // The desktop contrast guard waits for finite animations to settle before
  // reading any colour, and skips infinite ones. A looping animation here
  // would buy nothing and could only add flake, so this theme has none.
  it('runs no looping animation for nouveau', () => {
    const { container } = render(<ThemeBackground theme="nouveau" />)
    // Assert the layer exists first. Without this line the "no animation"
    // half also passes against a component that renders nothing at all,
    // which is exactly the state this test starts from.
    expect(container.querySelector('[data-testid="nouveau-wash"]')).not.toBeNull()
    expect(container.querySelectorAll('[class*="animate-float"]')).toHaveLength(0)
  })

  it('paints the nouveau wash with warm radial gradients', () => {
    const { container } = render(<ThemeBackground theme="nouveau" />)
    const wash = container.querySelector('[data-testid="nouveau-wash"]') as HTMLElement
    expect(wash).not.toBeNull()
    expect(wash.style.backgroundImage).toMatch(/radial-gradient/)
  })

  // The outer layer is opaque and covers the whole viewport, so this hex is
  // not decoration: if it drifted from --bg-primary, the entire app would
  // repaint the stale colour rather than just showing it in gaps. It is the
  // fourth copy of this value in the codebase and the only one no other
  // guard covers.
  it('backs the nouveau layer with the theme background colour', () => {
    const { container } = render(<ThemeBackground theme="nouveau" />)
    const root = container.firstElementChild as HTMLElement
    expect(root).not.toBeNull()
    expect(root.className).toMatch(/bg-\[#FDF6EA\]/)
  })
})
