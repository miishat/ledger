import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ToolInfoButton } from './ToolInfoButton'
import { getTool } from './toolRegistry'

describe('ToolInfoButton', () => {
  it('opens a popover with how-to and parameter glossary', () => {
    render(<ToolInfoButton tool={getTool('mortgage')!} />)
    fireEvent.click(screen.getByRole('button', { name: 'About this tool' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('GDS Ratio')).toBeTruthy()
  })
})
