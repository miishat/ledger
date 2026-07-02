import React from 'react'

interface CalculatorFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
}

export const CalculatorField: React.FC<CalculatorFieldProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  prefix,
  suffix,
}) => (
  <label className="flex flex-col gap-1">
    <span className="text-[13px] font-medium text-text-secondary">{label}</span>
    <div className="flex items-center gap-2 bg-bg-primary/50 border border-border rounded-lg px-3 py-2 focus-within:border-accent transition-colors">
      {prefix && <span className="text-[13px] text-text-secondary">{prefix}</span>}
      <input
        type="number"
        className="w-full bg-transparent text-text-primary text-[15px] outline-none"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
      {suffix && <span className="text-[13px] text-text-secondary">{suffix}</span>}
    </div>
  </label>
)
