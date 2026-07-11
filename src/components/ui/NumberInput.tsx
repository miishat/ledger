import React, { useState } from 'react'

interface NumberInputProps {
  value: number
  onCommit: (value: number) => void
  id?: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
  disabled?: boolean
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  step: _step,
  ...rest
}) => {
  // null = not editing; otherwise the raw text being typed.
  const [text, setText] = useState<string | null>(null)

  const clamp = (n: number) =>
    Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, n))

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text ?? String(value)}
      onFocus={() => setText(value === 0 ? '' : String(value))}
      onChange={(e) => {
        const next = e.target.value
        if (!NUMERIC.test(next)) return
        setText(next)
        const parsed = parseFloat(next)
        if (!Number.isNaN(parsed)) onCommit(clamp(parsed))
      }}
      onBlur={() => {
        if (text !== null) {
          const parsed = parseFloat(text)
          onCommit(clamp(Number.isNaN(parsed) ? 0 : parsed))
        }
        setText(null)
      }}
      {...rest}
    />
  )
}
