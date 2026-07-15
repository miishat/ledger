import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { setMatchMedia } from '../../test-utils/matchMedia'
import { DisclaimerModal } from './DisclaimerModal'

describe('DisclaimerModal', () => {
  it('does not close on scrim click when ack is required', () => {
    setMatchMedia(true)
    const onClose = vi.fn()
    const { getByTestId } = render(<DisclaimerModal isOpen requireAck onClose={onClose} />)
    fireEvent.click(getByTestId('sheet-scrim'))
    expect(onClose).not.toHaveBeenCalled()
  })
  it('closes on scrim click when ack is not required', () => {
    setMatchMedia(true)
    const onClose = vi.fn()
    const { getByTestId } = render(<DisclaimerModal isOpen requireAck={false} onClose={onClose} />)
    fireEvent.click(getByTestId('sheet-scrim'))
    expect(onClose).toHaveBeenCalled()
  })
})
