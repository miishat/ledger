import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemedDatePicker } from './ThemedDatePicker'

describe('ThemedDatePicker', () => {
  it('shows the value and opens a calendar grid', () => {
    render(<ThemedDatePicker value="2026-07-05" onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /2026-07-05/ }))
    expect(screen.getByRole('grid')).toBeTruthy()
    expect(screen.getByText('July 2026')).toBeTruthy()
  })

  it('selects a day and emits YYYY-MM-DD', () => {
    const onChange = vi.fn()
    render(<ThemedDatePicker value="2026-07-05" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /2026-07-05/ }))
    fireEvent.click(screen.getByRole('gridcell', { name: '14' }))
    expect(onChange).toHaveBeenCalledWith('2026-07-14')
  })

  it('navigates months', () => {
    render(<ThemedDatePicker value="2026-07-05" onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /2026-07-05/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByText('June 2026')).toBeTruthy()
  })
})
