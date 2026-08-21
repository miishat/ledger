import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { Tabs } from './Tabs'

const ITEMS = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
  { id: 'three', label: 'Three' },
] as const

function Harness() {
  const [value, setValue] = useState<'one' | 'two' | 'three'>('one')
  return <Tabs items={ITEMS} value={value} onChange={setValue} ariaLabel="Sections" />
}

describe('Tabs', () => {
  it('exposes tablist and tab roles with the active tab selected', () => {
    render(<Harness />)
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'One', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Two', selected: false })).toBeInTheDocument()
  })

  it('keeps only the active tab in the tab order', () => {
    render(<Harness />)
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('tabindex', '-1')
  })

  it('moves selection with ArrowRight and wraps at the end', () => {
    render(<Harness />)
    const first = screen.getByRole('tab', { name: 'One' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Two', selected: true })).toBeInTheDocument()

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Two' }), { key: 'ArrowRight' })
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Three' }), { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'One', selected: true })).toBeInTheDocument()
  })

  it('jumps to the first and last tab with Home and End', () => {
    render(<Harness />)
    const first = screen.getByRole('tab', { name: 'One' })
    first.focus()
    fireEvent.keyDown(first, { key: 'End' })
    expect(screen.getByRole('tab', { name: 'Three', selected: true })).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Three' }), { key: 'Home' })
    expect(screen.getByRole('tab', { name: 'One', selected: true })).toBeInTheDocument()
  })

  it('links each tab to its panel', () => {
    render(<Harness />)
    const tab = screen.getByRole('tab', { name: 'Two' })
    expect(tab).toHaveAttribute('id', 'tab-two')
    expect(tab).toHaveAttribute('aria-controls', 'panel-two')
  })
})
