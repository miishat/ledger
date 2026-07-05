import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemedSelect } from './ThemedSelect'

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]

describe('ThemedSelect', () => {
  it('shows the selected label and opens a listbox on click', () => {
    render(<ThemedSelect value="a" options={options} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /alpha/i }))
    expect(screen.getByRole('listbox')).toBeTruthy()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('selects an option on click and closes', () => {
    const onChange = vi.fn()
    render(<ThemedSelect value="a" options={options} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /alpha/i }))
    fireEvent.click(screen.getByRole('option', { name: 'Beta' }))
    expect(onChange).toHaveBeenCalledWith('b')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('supports keyboard: ArrowDown moves highlight, Enter selects, Escape closes', () => {
    const onChange = vi.fn()
    render(<ThemedSelect value="a" options={options} onChange={onChange} />)
    const trigger = screen.getByRole('button', { name: /alpha/i })
    fireEvent.keyDown(trigger, { key: 'Enter' })       // open
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })   // highlight Beta
    fireEvent.keyDown(trigger, { key: 'Enter' })       // select
    expect(onChange).toHaveBeenCalledWith('b')
    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
