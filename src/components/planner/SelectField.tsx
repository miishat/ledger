import React from 'react'

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}

/** Dropdown twin of CalculatorField: identical label markup and control height
 *  so inputs and selects bottom-align in shared grid rows. */
export const SelectField: React.FC<SelectFieldProps> = ({ label, value, onChange, children }) => {
  const selectId = `select-field-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div>
      <label htmlFor={selectId} className="text-[13px] font-medium text-text-secondary block mb-1">
        {label}
      </label>
      <select
        id={selectId}
        className="w-full bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[15px] outline-none focus:border-accent transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  )
}
