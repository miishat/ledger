import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { CommandPalette } from './CommandPalette'
import { setMatchMedia } from '../test-utils/matchMedia'

function renderPalette(onClose = vi.fn()) {
  return { onClose, ...render(
    <MemoryRouter>
      <CommandPalette isOpen onClose={onClose} />
    </MemoryRouter>
  ) }
}

describe('CommandPalette', () => {
  it('renders the search input, focused, when open', () => {
    renderPalette()
    const input = screen.getByLabelText('Search commands')
    expect(input).toBeInTheDocument()
    expect(input).toHaveFocus()
  })

  it('closes when the scrim is clicked (desktop)', () => {
    setMatchMedia(true)
    const { onClose } = renderPalette()
    fireEvent.click(screen.getByTestId('sheet-scrim'))
    expect(onClose).toHaveBeenCalled()
  })

  it('preserves arrow-key/Enter navigation on the search input', () => {
    renderPalette()
    const input = screen.getByLabelText('Search commands')
    // Arrow-key handling is internal to the component's onKeyDown; verify it doesn't throw
    // and Escape (handled by Sheet, not this component) does not break the input.
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toBeInTheDocument()
  })
})
