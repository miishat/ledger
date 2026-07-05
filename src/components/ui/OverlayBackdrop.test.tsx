import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { OverlayBackdrop } from './OverlayBackdrop'

describe('OverlayBackdrop', () => {
  it('renders a blurred backdrop and calls onClose when clicked', () => {
    const onClose = vi.fn()
    const { getByTestId } = render(<OverlayBackdrop onClose={onClose} />)
    const el = getByTestId('overlay-backdrop')
    expect(el.className).toContain('backdrop-blur-md')
    expect(el.className).toContain('bg-black/50')
    fireEvent.click(el)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
