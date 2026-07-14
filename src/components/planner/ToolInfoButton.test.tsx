import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ToolInfoButton } from './ToolInfoButton'
import { getTool } from './toolRegistry'
import { resetMatchMedia, setMatchMedia } from '../../test-utils/matchMedia'

describe('ToolInfoButton', () => {
  afterEach(() => {
    resetMatchMedia()
  })

  it('opens a popover with how-to and parameter glossary', () => {
    render(<ToolInfoButton tool={getTool('mortgage')!} />)
    fireEvent.click(screen.getByRole('button', { name: 'About this tool' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('GDS Ratio')).toBeTruthy()
  })

  it('opens an info sheet on mobile and closes via scrim', async () => {
    setMatchMedia(false)
    const tool = getTool('mortgage')!
    const { getByLabelText, getByTestId, queryByTestId } = render(<ToolInfoButton tool={tool} />)
    fireEvent.click(getByLabelText('About this tool'))
    expect(getByTestId('sheet-panel')).toBeInTheDocument()
    expect(getByTestId('sheet-panel')).toHaveTextContent(tool.name)
    fireEvent.click(getByTestId('sheet-scrim'))
    await waitFor(() => expect(queryByTestId('sheet-panel')).toBeNull())
  })
})
