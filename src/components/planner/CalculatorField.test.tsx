import { fireEvent, render, screen } from '@testing-library/react'
import { CalculatorField } from './CalculatorField'
import { ResultCard } from './ResultCard'
import { formatMoney } from './format'

describe('CalculatorField', () => {
  it('renders a labelled number input with the current value', () => {
    render(<CalculatorField label="Starting amount" value={5000} onChange={() => {}} />)
    expect(screen.getByLabelText('Starting amount')).toHaveValue(5000)
  })

  it('emits numeric values on change, and 0 for empty input', () => {
    const onChange = vi.fn()
    render(<CalculatorField label="Years" value={10} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Years'), { target: { value: '25' } })
    expect(onChange).toHaveBeenCalledWith(25)
    fireEvent.change(screen.getByLabelText('Years'), { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith(0)
  })
})

describe('ResultCard', () => {
  it('renders label and value', () => {
    render(<ResultCard label="Future value" value="$1,234" />)
    expect(screen.getByText('Future value')).toBeInTheDocument()
    expect(screen.getByText('$1,234')).toBeInTheDocument()
  })
})

describe('formatMoney', () => {
  it('rounds and adds separators', () => {
    expect(formatMoney(1234567.89)).toBe('$1,234,568')
    expect(formatMoney(0)).toBe('$0')
    expect(formatMoney(-500.4)).toBe('-$500')
  })
})
