import type { ExclusionRuleDraft } from '../../types/exclusionRules'
import { cashMovementCents, validateExclusionDraft } from './exclusionRules'

const sources = { a: { id: 'a', name: 'Card A' } }
const draft: ExclusionRuleDraft = {
  name: 'Payments', sourceId: 'a', description: { operator: 'exact', value: 'PAYMENT' },
  direction: 'in', amount: { operator: 'any' }, behavior: 'review',
}

describe('exclusion rule money and validation', () => {
  it('distinguishes refunds from purchases and rejects inverted cent ranges', () => {
    expect(cashMovementCents({ type: 'expense', amount: -12.5 })).toBe(1250)
    expect(cashMovementCents({ type: 'expense', amount: 12.5 })).toBe(-1250)
    expect(cashMovementCents({ type: 'income', amount: 12.5 })).toBe(1250)
    expect(validateExclusionDraft({ ...draft,
      amount: { operator: 'between', minCents: 2000, maxCents: 1000 } }, sources))
      .toContain('Enter a valid amount range')
  })

  it('requires a name, description and an available or explicit all-source scope', () => {
    expect(validateExclusionDraft({ ...draft, name: ' ', sourceId: 'missing',
      description: { operator: 'exact', value: '\t' } }, sources)).toEqual([
      'Enter a rule name', 'Enter a description pattern', 'Choose an available card or account',
    ])
    expect(validateExclusionDraft({ ...draft, sourceId: null }, sources)).toEqual([])
    expect(validateExclusionDraft({ ...draft, sourceId: undefined } as unknown as ExclusionRuleDraft, sources))
      .toContain('Choose an available card or account')
  })

  it.each([NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid exact cents %s', cents => {
    expect(validateExclusionDraft({ ...draft, amount: { operator: 'exact', cents } }, sources))
      .toContain('Enter a valid amount')
  })

  it.each([NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid range cents %s', cents => {
    expect(validateExclusionDraft({ ...draft, amount: { operator: 'between', minCents: cents, maxCents: 100 } }, sources))
      .toContain('Enter a valid amount range')
    expect(validateExclusionDraft({ ...draft, amount: { operator: 'between', minCents: 0, maxCents: cents } }, sources))
      .toContain('Enter a valid amount range')
  })

  it('allows zero and inclusive safe cent boundaries', () => {
    expect(cashMovementCents({ type: 'income', amount: 0 })).toBe(0)
    expect(cashMovementCents({ type: 'income', amount: 12.345 })).toBe(1235)
    for (const cents of [0, 100, Number.MAX_SAFE_INTEGER]) {
      expect(validateExclusionDraft({ ...draft, amount: { operator: 'exact', cents } }, sources)).toEqual([])
      expect(validateExclusionDraft({ ...draft, amount: { operator: 'between', minCents: cents, maxCents: cents } }, sources)).toEqual([])
    }
  })

  it.each([
    { description: { operator: 'regex', value: 'PAYMENT' } },
    { direction: 'sideways' }, { behavior: 'unknown' }, { amount: { operator: 'unknown' } },
    { description: null }, { amount: null }, { name: 123 }, { sourceId: 42 },
  ])('rejects malformed restored draft %j', patch => {
    expect(validateExclusionDraft({ ...draft, ...patch } as unknown as ExclusionRuleDraft, sources).length).toBeGreaterThan(0)
  })
})
