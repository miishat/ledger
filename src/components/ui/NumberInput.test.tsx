import { render, screen, fireEvent } from '@testing-library/react'
import { NumberInput } from './NumberInput'

describe('NumberInput', () => {
  it('renders the numeric value', () => {
    render(<NumberInput aria-label="amt" value={42} onCommit={() => {}} />)
    expect(screen.getByLabelText('amt')).toHaveValue('42')
  })

  it('starts empty when focusing a zero value, so typing 100 gives 100 (not 0100)', () => {
    const onCommit = vi.fn()
    render(<NumberInput aria-label="amt" value={0} onCommit={onCommit} />)
    const input = screen.getByLabelText('amt')
    fireEvent.focus(input)
    expect(input).toHaveValue('')
    fireEvent.change(input, { target: { value: '100' } })
    expect(input).toHaveValue('100')
    expect(onCommit).toHaveBeenLastCalledWith(100)
  })

  it('allows clearing while editing and commits 0 on blur', () => {
    const onCommit = vi.fn()
    render(<NumberInput aria-label="amt" value={250} onCommit={onCommit} />)
    const input = screen.getByLabelText('amt')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '' } })
    expect(input).toHaveValue('') // stays empty — no snap to 0
    fireEvent.blur(input)
    expect(onCommit).toHaveBeenLastCalledWith(0)
    expect(input).toHaveValue('0')
  })

  it('ignores non-numeric characters', () => {
    const onCommit = vi.fn()
    render(<NumberInput aria-label="amt" value={5} onCommit={onCommit} />)
    const input = screen.getByLabelText('amt')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'abc' } })
    expect(input).toHaveValue('5')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('clamps to min/max on commit', () => {
    const onCommit = vi.fn()
    render(<NumberInput aria-label="pct" value={50} min={0} max={100} onCommit={onCommit} />)
    const input = screen.getByLabelText('pct')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '150' } })
    expect(onCommit).toHaveBeenLastCalledWith(100)
  })

  it('renders decimals and accepts decimal typing', () => {
    const onCommit = vi.fn()
    render(<NumberInput aria-label="amt" value={0} onCommit={onCommit} />)
    const input = screen.getByLabelText('amt')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '0.5' } })
    expect(onCommit).toHaveBeenLastCalledWith(0.5)
  })
})
