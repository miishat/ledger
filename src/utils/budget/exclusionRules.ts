import type { ExclusionRuleDraft } from '../../types/exclusionRules'
import type { ImportSource } from '../../types/importHistory'
import type { TriageTransaction } from '../../types/triage'

export const cashMovementCents = (row: Pick<TriageTransaction, 'type' | 'amount'>) =>
  Math.round((row.type === 'income' ? row.amount : -row.amount) * 100)

// Persisted drafts can have malformed runtime values despite their TS contract.
export function validateExclusionDraft(draft: ExclusionRuleDraft,
  sources: Record<string, ImportSource>): string[] {
  const errors: string[] = []
  if (typeof draft?.name !== 'string' || !draft.name.trim()) errors.push('Enter a rule name')
  if (typeof draft?.description?.value !== 'string' || !draft.description.value.trim()) errors.push('Enter a description pattern')
  if (draft?.sourceId !== null && (typeof draft?.sourceId !== 'string' || !Object.hasOwn(sources, draft.sourceId))) {
    errors.push('Choose an available card or account')
  }
  if (!['exact', 'contains', 'starts-with'].includes(draft?.description?.operator)) errors.push('Choose a valid description operator')
  if (!['in', 'out', 'either'].includes(draft?.direction)) errors.push('Choose a valid money direction')
  if (!['review', 'automatic'].includes(draft?.behavior)) errors.push('Choose a valid rule behavior')
  const cents = (n: number) => Number.isSafeInteger(n) && n >= 0
  const amount = draft?.amount
  if (!amount || !['any', 'exact', 'between'].includes(amount.operator)) errors.push('Choose a valid amount operator')
  if (amount?.operator === 'exact' && !cents(amount.cents)) errors.push('Enter a valid amount')
  if (amount?.operator === 'between' && (!cents(amount.minCents) ||
    !cents(amount.maxCents) || amount.minCents > amount.maxCents)) errors.push('Enter a valid amount range')
  return errors
}
