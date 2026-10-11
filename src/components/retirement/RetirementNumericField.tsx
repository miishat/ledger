import { useContext, useEffect, useId, useState, type ReactNode } from 'react'
import { RetirementValidationContext } from './retirementPresentation'

export function RetirementNumericField({ label, value, onChange, nullable = false, signed = false, max, integer = false, help }: {
  label: string; value: number | null; onChange: (value: number | null) => void; nullable?: boolean; signed?: boolean; max?: number; integer?: boolean; help?: ReactNode
}) {
  const id = useId()
  const report = useContext(RetirementValidationContext)
  const [draft, setDraft] = useState<{ raw: string; original: number | null } | null>(null)
  const raw = draft && Object.is(draft.original, value) ? draft.raw : value === null ? '' : String(value)
  const number = Number(raw)
  const invalid = !(nullable && raw.trim() === '') && (raw.trim() === '' || !Number.isFinite(number) || (!signed && number < 0) || (max !== undefined && number > max) || (integer && !Number.isInteger(number)))
  useEffect(() => { report(id, invalid) }, [id, invalid, report])
  useEffect(() => () => report(id, false), [id, report])
  return <div className="retirement-field">
    <label htmlFor={id}>{label}</label>
    <input id={id} type="text" inputMode="decimal" value={raw} aria-invalid={invalid || undefined} aria-describedby={invalid || help ? `${id}-help` : undefined}
      onChange={event => {
        const next = event.target.value; const parsed = Number(next)
        const bad = !(nullable && next.trim() === '') && (next.trim() === '' || !Number.isFinite(parsed) || (!signed && parsed < 0) || (max !== undefined && parsed > max) || (integer && !Number.isInteger(parsed)))
        const committed = next.trim() === '' && nullable ? null : parsed
        setDraft({ raw: next, original: bad ? value : committed }); report(id, bad)
        if (!bad) onChange(committed)
      }} />
    {(invalid || help) && <small id={`${id}-help`}>{invalid ? `Enter ${signed ? 'finite' : 'nonnegative finite'} ${integer ? 'whole numbers' : 'numbers'}${max !== undefined ? ` up to ${max}` : ''}.` : help}</small>}
  </div>
}
