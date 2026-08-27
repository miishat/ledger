import { readFileSync } from 'node:fs'
import { URL as NodeURL } from 'node:url'
import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeSwatchGrid, SWATCHES } from './ThemeSwatchGrid'
import { useThemeStore } from '../../store/useThemeStore'

describe('ThemeSwatchGrid', () => {
  beforeEach(() => useThemeStore.setState({ theme: 'luxury' }))

  it('renders every theme with the active one marked', () => {
    render(<ThemeSwatchGrid />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons).toHaveLength(6)
    expect(screen.getByRole('radio', { name: /Luxury Dark/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /Geometric Light/ })).toHaveAttribute('aria-checked', 'false')
  })

  it('applies a theme on click', () => {
    render(<ThemeSwatchGrid />)
    fireEvent.click(screen.getByRole('radio', { name: /Aurora Gradient/ }))
    expect(useThemeStore.getState().theme).toBe('aurora')
  })

  it('renders a sparkline preview in every tile', () => {
    const { container } = render(<ThemeSwatchGrid />)
    expect(container.querySelectorAll('svg polyline')).toHaveLength(6)
    expect(container.querySelectorAll('svg polyline')[2]).toHaveAttribute('stroke', '#d4a853')
  })
})

// The swatch colours are a hand-copy of src/index.css. Nothing but this
// stopped them drifting: a theme could be recoloured and its picker tile
// would keep advertising the old palette.
describe('ThemeSwatchGrid swatch parity with src/index.css', () => {
  // Use Node's own URL rather than the ambient global: this suite runs under
  // jsdom, which replaces global URL with one that resolves a string base
  // against its document location instead of this test file. Same reason
  // and construction as src/theme-tokens.test.ts; keep the two in sync.
  const css = readFileSync(new NodeURL('../../index.css', import.meta.url), 'utf8')

  const valueIn = (theme: string, token: string): string => {
    const start = css.indexOf(`[data-theme='${theme}'] {`)
    const block = css.slice(start, css.indexOf('\n}', start))
    const match = new RegExp(`${token}:\\s*(#[0-9a-fA-F]{3,8})`).exec(block)
    if (!match) throw new Error(`no ${token} in [data-theme='${theme}']`)
    return match[1].toLowerCase()
  }

  // Only bg is checked per theme here: geometric's accent (#3b82f6) is
  // deliberately lighter than its CSS value (#2563eb) for tile legibility,
  // so asserting accent for every theme would break that on purpose choice.
  it.each(Object.keys(SWATCHES))('%s tile mirrors the theme background', (theme) => {
    expect(SWATCHES[theme as keyof typeof SWATCHES].bg.toLowerCase()).toBe(valueIn(theme, '--bg-primary'))
  })

  it('names the sixth theme Gilded Bloom and marks it light', () => {
    expect(SWATCHES.nouveau.name).toBe('Gilded Bloom')
    expect(SWATCHES.nouveau.light).toBe(true)
    expect(SWATCHES.nouveau.accent.toLowerCase()).toBe(valueIn('nouveau', '--accent'))
  })
})
