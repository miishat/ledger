import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { Sheet } from './Sheet.tsx'
import { setMatchMedia, resetMatchMedia } from '../../test-utils/matchMedia'

beforeEach(() => resetMatchMedia())

describe('Sheet', () => {
  it('renders nothing when closed', () => {
    const { queryByTestId } = render(
      <Sheet open={false} onClose={() => {}} ariaLabel="x">body</Sheet>
    )
    expect(queryByTestId('sheet-panel')).toBeNull()
  })

  it('renders a dialog panel when open', () => {
    const { getByTestId, getByText } = render(
      <Sheet open onClose={() => {}} ariaLabel="x">hello</Sheet>
    )
    expect(getByTestId('sheet-panel').getAttribute('role')).toBe('dialog')
    expect(getByText('hello')).toBeInTheDocument()
  })

  it('closes on scrim click when dismissible', () => {
    const onClose = vi.fn()
    const { getByTestId } = render(
      <Sheet open onClose={onClose} ariaLabel="x">c</Sheet>
    )
    fireEvent.click(getByTestId('sheet-scrim'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes on Escape when dismissible', () => {
    const onClose = vi.fn()
    render(<Sheet open onClose={onClose} ariaLabel="x">c</Sheet>)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does NOT close on scrim/Escape when dismissible=false', () => {
    const onClose = vi.fn()
    const { getByTestId } = render(
      <Sheet open onClose={onClose} dismissible={false} ariaLabel="x">c</Sheet>
    )
    fireEvent.click(getByTestId('sheet-scrim'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows a Close button on mobile that calls onClose', () => {
    setMatchMedia(false) // mobile
    const onClose = vi.fn()
    const { getByLabelText } = render(
      <Sheet open onClose={onClose} ariaLabel="x">c</Sheet>
    )
    fireEvent.click(getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('locks body scroll while open', () => {
    const { unmount } = render(<Sheet open onClose={() => {}} ariaLabel="x">c</Sheet>)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
