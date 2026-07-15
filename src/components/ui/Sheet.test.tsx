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

  it('does not render a mobile Close button when dismissible=false', () => {
    setMatchMedia(false) // mobile
    const onClose = vi.fn()
    const { queryByLabelText } = render(
      <Sheet open onClose={onClose} dismissible={false} ariaLabel="x">c</Sheet>
    )
    expect(queryByLabelText('Close')).toBeNull()
  })

  it('traps focus: Tab from last element cycles to first, Shift+Tab from first cycles to last', () => {
    const { getByTestId, getByText } = render(
      <Sheet open onClose={() => {}} ariaLabel="x">
        <button>first</button>
        <button>middle</button>
        <button>last</button>
      </Sheet>
    )
    const panel = getByTestId('sheet-panel')
    const first = getByText('first')
    const last = getByText('last')

    last.focus()
    expect(document.activeElement).toBe(last)
    fireEvent.keyDown(panel, { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    first.focus()
    expect(document.activeElement).toBe(first)
    fireEvent.keyDown(panel, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })

  it('Escape closes only the topmost of two stacked dismissible Sheets', () => {
    const onCloseFirst = vi.fn()
    const onCloseSecond = vi.fn()
    render(
      <>
        <Sheet open onClose={onCloseFirst} ariaLabel="first">first</Sheet>
        <Sheet open onClose={onCloseSecond} ariaLabel="second">second</Sheet>
      </>
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCloseSecond).toHaveBeenCalledOnce()
    expect(onCloseFirst).not.toHaveBeenCalled()
  })

  it('a non-dismissible Sheet on top blocks Escape from reaching a dismissible Sheet below', () => {
    const onCloseFirst = vi.fn()
    const onCloseSecond = vi.fn()
    render(
      <>
        <Sheet open onClose={onCloseFirst} ariaLabel="first">first</Sheet>
        <Sheet open onClose={onCloseSecond} dismissible={false} ariaLabel="second">second</Sheet>
      </>
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCloseSecond).not.toHaveBeenCalled()
    expect(onCloseFirst).not.toHaveBeenCalled()
  })

  it('clamps popover position within the viewport near the right edge', () => {
    setMatchMedia(true) // desktop
    const originalInnerWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 400 })

    const anchor = document.createElement('button')
    anchor.getBoundingClientRect = () =>
      ({ left: 380, right: 400, top: 50, bottom: 70, width: 20, height: 20 }) as DOMRect
    document.body.appendChild(anchor)
    const anchorRef = { current: anchor }

    const { getByTestId } = render(
      <Sheet open onClose={() => {}} desktop="popover" anchorRef={anchorRef} ariaLabel="x">
        popover body
      </Sheet>
    )
    const panel = getByTestId('sheet-panel')
    const left = parseFloat(panel.style.left)
    expect(left).toBeGreaterThanOrEqual(8)
    expect(left).toBeLessThanOrEqual(window.innerWidth)

    document.body.removeChild(anchor)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth })
  })
})
