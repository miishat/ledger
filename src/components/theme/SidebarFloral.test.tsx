import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { SidebarFloral } from './SidebarFloral'

describe('SidebarFloral', () => {
  it.each(['geometric', 'tactical', 'luxury', 'aurora', 'glass'] as const)(
    'renders nothing for %s',
    (theme) => {
      const { container } = render(<SidebarFloral theme={theme} />)
      expect(container).toBeEmptyDOMElement()
    },
  )

  it('renders an ornament for nouveau', () => {
    const { getByTestId } = render(<SidebarFloral theme="nouveau" />)
    expect(getByTestId('sidebar-floral').querySelector('svg')).not.toBeNull()
  })

  // Pure decoration with no text: it must be hidden from assistive tech and
  // must never swallow a click aimed at the nav links behind it.
  it('is hidden from assistive tech and not clickable', () => {
    const { getByTestId } = render(<SidebarFloral theme="nouveau" />)
    const wrapper = getByTestId('sidebar-floral')
    expect(wrapper).toHaveAttribute('aria-hidden', 'true')
    expect(wrapper.className).toMatch(/pointer-events-none/)
  })

  // It paints inside the sidebar's own stacking context, behind the nav
  // links. A positive or auto z-index here would cover them.
  it('sits behind the sidebar content', () => {
    const { getByTestId } = render(<SidebarFloral theme="nouveau" />)
    const wrapper = getByTestId('sidebar-floral')
    expect(wrapper.style.zIndex).toBe('-10')
    expect(wrapper.className).toMatch(/absolute/)
    expect(wrapper.className).toMatch(/overflow-hidden/)
  })

  // This ornament runs the full height of the sidebar on purpose and is not
  // faded or clipped where the settings dock overlaps it. The dock stays
  // legible by being a frosted panel of its own, which is a property of the
  // dock and is asserted in e2e/desktop-guards.spec.ts. It cannot be checked
  // here: jsdom resolves neither backdrop-filter nor a var() indirection in
  // an inline style, reporting both as empty, so a test written against
  // jsdom could not tell a working dock from a transparent one.

  // The gold and the peacock green both come from the theme block, so
  // changing the palette in one place changes the ornament too.
  it('draws from theme tokens rather than hardcoded colours', () => {
    const { getByTestId } = render(<SidebarFloral theme="nouveau" />)
    const svg = getByTestId('sidebar-floral').querySelector('svg') as SVGSVGElement
    expect(svg.style.color).toBe('var(--ornament)')
    const blooms = getByTestId('sidebar-floral').querySelector('[data-testid="floral-blooms"]') as SVGGElement
    expect(blooms).not.toBeNull()
    expect(blooms.style.color).toBe('var(--accent)')
  })
})
