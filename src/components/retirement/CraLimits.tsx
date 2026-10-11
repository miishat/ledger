import { useId } from 'react'
import type { CapacityValue, SharedTaxProfile } from '../../utils/finance/retirementTypes'
import { RetirementNumericField } from './RetirementNumericField'

function CapacityField({ label, name, capacity, onChange, year, signed = false }: { label: string; name: string; capacity: CapacityValue; onChange: (value: CapacityValue) => void; year: number; signed?: boolean }) {
  const id = useId()
  const value = capacity && typeof capacity === 'object' ? capacity : { state: 'unknown' as const }
  return <fieldset className="retirement-group"><legend>{name}</legend>
    <label className="retirement-field" htmlFor={id}><span>{name} State</span><select id={id} value={value.state} onChange={e => onChange(e.target.value === 'unknown' ? { state: 'unknown' } : { state: 'known', value: value.value ?? 0, sourceYear: value.sourceYear ?? year })}>
      <option value="unknown">Unknown</option><option value="known">Known (Including Zero)</option>{value.state === 'legacy' && <option value="legacy">Legacy / Needs Review</option>}
    </select></label>
    {value.state !== 'unknown' && <><RetirementNumericField label={label} value={value.value ?? null} signed={signed} onChange={n => onChange({ ...value, value: n ?? undefined })} />
      <RetirementNumericField label={`${name} Source Year`} value={value.sourceYear ?? null} nullable integer onChange={n => onChange({ ...value, sourceYear: n ?? undefined })} help="Blank means Source Year Unknown." />
      {value.state === 'legacy' && <><strong className="retirement-notice-title">Unverified Legacy Limit</strong><p>Source Year Unknown. Preserved amount is a provisional deduction cap; it establishes no new contribution room.</p><button type="button" className="retirement-button" onClick={() => onChange({ state: 'known', value: value.value ?? 0, sourceYear: year })}>Confirm {name} for {year}</button></>}
      {value.sourceYear !== undefined && value.sourceYear !== year && <p>Limits Need Review. Supplied {value.sourceYear} capacity is unknown for this {year} scenario.</p>}
    </>}
  </fieldset>
}
export function CraLimits({ profile, onChange, onClear, taxYear = 2026 }: { profile: SharedTaxProfile; onChange: (updates: Partial<SharedTaxProfile>) => void; onClear: () => void; taxYear?: number }) {
  return <><p className="retirement-help">Enter scenario-opening CRA amounts before the contributions modeled here. Deduction capacity and new contribution room are independent. No room is inferred from salary.</p><div className="retirement-fields">
    <CapacityField name="Deduction Limit" label="CRA RRSP Deduction Limit" capacity={profile.rrspDeductionLimit} onChange={rrspDeductionLimit => onChange({ rrspDeductionLimit })} year={taxYear} />
    <CapacityField name="Contribution Room" label="CRA Available Contribution Room" capacity={profile.rrspContributionRoom} onChange={rrspContributionRoom => onChange({ rrspContributionRoom })} year={taxYear} signed />
  </div><button type="button" className="retirement-button" onClick={onClear}>Clear CRA Limits</button><p className="retirement-help">These settings are shared with Compensation. A negative contribution-room value records an existing deficit. Following-year PA does not reduce these supplied current-year amounts.</p></>
}
