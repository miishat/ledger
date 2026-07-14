import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ThemeSelector } from './ThemeSelector'
import { useThemeStore } from '../../store/useThemeStore'
import { resetMatchMedia, setMatchMedia } from '../../test-utils/matchMedia'

describe('ThemeSelector', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'luxury' })
  })

  afterEach(() => {
    resetMatchMedia()
  })

  it('opens a popover listing the available themes on click', () => {
    render(<ThemeSelector />)
    fireEvent.click(screen.getByRole('button', { name: /theme/i }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /Tactical Dark/i })).toBeTruthy()
  })

  it('selects a theme on menu item click', () => {
    render(<ThemeSelector />)
    fireEvent.click(screen.getByRole('button', { name: /theme/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Tactical Dark/i }))
    expect(useThemeStore.getState().theme).toBe('tactical')
  })

  it('opens a bottom sheet on mobile and closes via scrim', async () => {
    setMatchMedia(false)
    const { getByTestId, queryByTestId } = render(<ThemeSelector />)
    fireEvent.click(screen.getByRole('button', { name: /theme/i }))
    expect(getByTestId('sheet-panel')).toBeInTheDocument()
    fireEvent.click(getByTestId('sheet-scrim'))
    await waitFor(() => expect(queryByTestId('sheet-panel')).toBeNull())
  })
})
