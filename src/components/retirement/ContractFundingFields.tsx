import { useState } from 'react'
import type { MatchingContract, MatchingTier } from '../../utils/finance/retirementTypes'
import { RetirementNumericField } from './RetirementNumericField'

export function ContractFundingFields({ contract, onChange }: {
  contract: MatchingContract
  onChange: (patch: Partial<MatchingContract>) => void
}) {
  // Older tiers have no stored identity. Seed local identities once and persist
  // them only with an explicit tier edit; numeric matching terms are untouched.
  const [tierIds, setTierIds] = useState(() => {
    const seen = new Set<string>()
    return contract.tiers.map(tier => {
      const id = typeof tier?.id === 'string' && tier.id && !seen.has(tier.id)
        ? tier.id : crypto.randomUUID()
      seen.add(id)
      return id
    })
  })

  const identifiedTiers = contract.tiers.map((tier, index) => ({
    ...tier,
    id: tierIds[index] ?? tier?.id,
  }))

  const editTier = (index: number, patch: Partial<MatchingTier>) => {
    onChange({ tiers: identifiedTiers.map((tier, i) => i === index ? { ...tier, ...patch } : tier) })
  }
  const removeTier = (index: number) => {
    setTierIds(ids => ids.filter((_, i) => i !== index))
    onChange({ tiers: identifiedTiers.filter((_, i) => i !== index) })
  }
  const addTier = () => {
    const id = crypto.randomUUID()
    setTierIds(ids => [...ids, id])
    onChange({ tiers: [...identifiedTiers, { id, lowerPercent: 0, upperPercent: 1, matchRatio: 0 }] })
  }

  return <>
    <fieldset className="retirement-group">
      <legend>Conditional Match</legend>
      {contract.tiers.map((tier, index) => (
        <div key={tierIds[index] ?? tier?.id} className="retirement-tier">
          <RetirementNumericField
            label={`Tier ${index + 1} Employee From Percent`}
            value={tier?.lowerPercent}
            max={100}
            onChange={value => editTier(index, { lowerPercent: value ?? 0 })}
          />
          <RetirementNumericField
            label={`Tier ${index + 1} Match Up To Percent`}
            value={tier?.upperPercent}
            max={100}
            onChange={value => editTier(index, { upperPercent: value ?? 0 })}
          />
          <RetirementNumericField
            label={`Tier ${index + 1} Employer Match Rate`}
            value={tier?.matchRatio}
            onChange={value => editTier(index, { matchRatio: value ?? 0 })}
            help="Employer dollars per employee dollar; 0.5 means 50%."
          />
          <button type="button" className="retirement-button" onClick={() => removeTier(index)}>
            Remove Tier {index + 1}
          </button>
        </div>
      ))}
      <button type="button" className="retirement-button" onClick={addTier}>Add Matching Tier</button>
      <p className="retirement-help">
        Ordered, non-overlapping intervals. Unmatched gaps are allowed. No default contractual match is assumed.
      </p>
    </fieldset>
    <fieldset className="retirement-group">
      <legend>Additional Funding & Cap</legend>
      <label className="retirement-field">
        <span>Unconditional Funding Basis</span>
        <select value={contract.unconditionalEmployer.mode} onChange={event => onChange({
          unconditionalEmployer: { ...contract.unconditionalEmployer, mode: event.target.value as 'dollars' | 'percent' },
        })}>
          <option value="dollars">Annual Dollars</option>
          <option value="percent">Percent of Eligible Earnings</option>
        </select>
      </label>
      <RetirementNumericField
        label="Unconditional Employer Contribution"
        value={contract.unconditionalEmployer.value}
        max={contract.unconditionalEmployer.mode === 'percent' ? 100 : undefined}
        onChange={value => onChange({ unconditionalEmployer: { ...contract.unconditionalEmployer, value: value ?? 0 } })}
      />
      <label className="retirement-check">
        <input type="checkbox" checked={contract.employerAnnualCap === null}
          onChange={event => onChange({ employerAnnualCap: event.target.checked ? null : 0 })} />
        No Annual Cap
      </label>
      {contract.employerAnnualCap !== null && (
        <RetirementNumericField label="Annual Employer Cap" value={contract.employerAnnualCap}
          onChange={employerAnnualCap => onChange({ employerAnnualCap })} />
      )}
      <p className="retirement-help">
        Zero cap means zero employer funding. The cap applies to conditional and unconditional funding together.
      </p>
    </fieldset>
  </>
}
