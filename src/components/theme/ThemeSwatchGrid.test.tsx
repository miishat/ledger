import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeSwatchGrid } from './ThemeSwatchGrid'
import { useThemeStore } from '../../store/useThemeStore'

describe('ThemeSwatchGrid', () => {
  beforeEach(() => useThemeStore.setState({ theme: 'luxury' }))

  it('renders all five themes with the active one marked', () => {
    render(<ThemeSwatchGrid />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons).toHaveLength(5)
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
    expect(container.querySelectorAll('svg polyline')).toHaveLength(5)
  })
})
