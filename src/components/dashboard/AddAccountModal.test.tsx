import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { setMatchMedia } from '../../test-utils/matchMedia'
import { AddAccountModal } from './AddAccountModal'

describe('AddAccountModal', () => {
  it('renders when open and closes via scrim', () => {
    setMatchMedia(true)
    const onClose = vi.fn()
    const { getByTestId } = render(<AddAccountModal isOpen onClose={onClose} />)
    expect(getByTestId('sheet-panel')).toBeInTheDocument()
    fireEvent.click(getByTestId('sheet-scrim'))
    expect(onClose).toHaveBeenCalled()
  })
})
