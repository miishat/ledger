import React, { useState, useEffect } from 'react'

interface NumberInputProps {
  value: number
  onCommit: (value: number) => void
  id?: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
  'aria-label'?: string
}

const NUMERIC = /^-?\d*\.?\d*$/

/** Numeric field without the native number-input pitfalls: may be empty while
 *  editing (no 0100), no spinner arrows, commits parsed numbers to the caller. */
export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onCommit,
  min,
  max,
  step: _step,
  ...rest
}) => {
  // null = not editing; otherwise the raw text being typed.
  const [text, setText] = useState<string | null>(null)
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const clamp = (n: number) =>
    Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, n))

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text ?? String(displayValue)}
      onFocus={() => setText(displayValue === 0 ? '' : String(displayValue))}
      onChange={(e) => {
        const next = e.target.value
        if (!NUMERIC.test(next)) return
        setText(next)
        const parsed = parseFloat(next)
        if (!Number.isNaN(parsed)) {
          const clamped = clamp(parsed)
          onCommit(clamped)
          setDisplayValue(clamped)
        }
      }}
      onBlur={() => {
        if (text !== null) {
          const parsed = parseFloat(text)
          const clamped = clamp(Number.isNaN(parsed) ? 0 : parsed)
          onCommit(clamped)
          setDisplayValue(clamped)
        }
        setText(null)
      }}
      {...rest}
    />
  )
}
