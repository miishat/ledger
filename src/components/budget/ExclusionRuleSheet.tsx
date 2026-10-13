import { useState } from 'react'
import { Sheet } from '../ui/Sheet'
import { ThemedSelect } from '../ui/ThemedSelect'
import { ExclusionRulePreview } from './ExclusionRulePreview'
import { useTriageStore } from '../../store/useTriageStore'
import type { ExclusionRuleDraft } from '../../types/exclusionRules'
import { cashMovementCents, evaluateExclusionRules, previewExclusionRule, validateExclusionDraft } from '../../utils/budget/exclusionRules'
import { captureTriageUndo } from '../../utils/budget/triageUndo'

export type ExclusionRuleSheetProps = { open: boolean; onClose: () => void; ruleId?: string; seedRecordId?: string }
const inputClass = 'min-h-11 w-full rounded-md border border-border bg-bg-secondary px-3 text-text-primary'
function parseAmountCents(text: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(text.trim())) return null
  const value = Math.round(Number(text.trim()) * 100)
  return Number.isSafeInteger(value) ? value : null
}

// Mount the form afresh for each open/target, without writing to persisted state.
export function ExclusionRuleSheet(props: ExclusionRuleSheetProps) {
  return props.open ? <RuleForm key={`${props.ruleId ?? ''}:${props.seedRecordId ?? ''}`} {...props} /> : null
}
function RuleForm({ open, onClose, ruleId, seedRecordId }: ExclusionRuleSheetProps) {
  const sources = useTriageStore(s => s.importSources)
  const records = useTriageStore(s => s.importRecords)
  const pending = useTriageStore(s => s.pendingTransactions)
  const rules = useTriageStore(s => s.exclusionRules)
  const existing = ruleId ? rules[ruleId] : undefined
  const seed = seedRecordId ? records[seedRecordId] : undefined
  const unavailable = !!seedRecordId && (!seed || !sources[seed.sourceId])
  const initial: ExclusionRuleDraft = existing ?? {
    name: seed?.original.description ?? '', sourceId: seed?.sourceId ?? '',
    description: { operator: 'exact', value: seed?.original.description ?? '' },
    direction: seed ? (cashMovementCents(seed.original) > 0 ? 'in' : cashMovementCents(seed.original) < 0 ? 'out' : 'either') : 'either',
    amount: { operator: 'any' }, behavior: 'review',
  }
  // Retain invalid persisted choices as placeholders, never broaden a malformed rule.
  const [name, setName] = useState(typeof initial.name === 'string' ? initial.name : '')
  const [scope, setScope] = useState(initial.sourceId === null ? 'all' : typeof initial.sourceId === 'string' ? initial.sourceId : '')
  const [operator, setOperator] = useState(initial.description?.operator ?? '' as ExclusionRuleDraft['description']['operator'])
  const [text, setText] = useState(typeof initial.description?.value === 'string' ? initial.description.value : '')
  const [direction, setDirection] = useState(initial.direction ?? '' as ExclusionRuleDraft['direction'])
  const [behavior, setBehavior] = useState(initial.behavior ?? '' as ExclusionRuleDraft['behavior'])
  const [amountOperator, setAmountOperator] = useState(initial.amount?.operator ?? '' as ExclusionRuleDraft['amount']['operator'])
  const [amountText, setAmountText] = useState(initial.amount?.operator === 'exact' ? String(initial.amount.cents / 100) : initial.amount?.operator === 'between' ? String(initial.amount.minCents / 100) : '')
  const [maxAmountText, setMaxAmountText] = useState(initial.amount?.operator === 'between' ? String(initial.amount.maxCents / 100) : '')
  const [applyPending, setApplyPending] = useState(false)
  const [saveError, setSaveError] = useState('')
  const cents = parseAmountCents(amountText), maxCents = parseAmountCents(maxAmountText)
  const amountError = amountOperator === 'exact' && cents === null ? 'Enter a valid amount' : amountOperator === 'between' && (cents === null || maxCents === null) ? 'Enter a valid amount range' : ''
  const draft: ExclusionRuleDraft = { name, sourceId: scope === 'all' ? null : scope,
    description: { operator, value: text }, direction, behavior,
    amount: amountOperator === 'exact' ? (cents === null ? {operator:'any'} : {operator:'exact', cents}) : amountOperator === 'between' ? (cents === null || maxCents === null ? {operator:'any'} : {operator:'between',minCents:cents,maxCents}) : { operator:amountOperator } as ExclusionRuleDraft['amount'] }
  const errors = validateExclusionDraft(draft, sources)
  if (amountError) errors.push(amountError)
  if (unavailable) errors.push('Source information unavailable')
  if (ruleId && !existing) errors.push('Choose an available exclusion rule')
  const preview = previewExclusionRule(draft, (amountError ? [] : Object.values(records).filter(r => !!sources[r.sourceId])), Object.values(pending))
  const eligible = Object.values(pending).filter(tx => { const r = tx.importRecordId && records[tx.importRecordId]; return r && r.decision === 'pending' && !!sources[r.sourceId] })
  const nextRules = [...Object.entries(rules).filter(([id, rule]) => id !== ruleId && rule?.id === id && rule?.enabled === true && validateExclusionDraft(rule, sources).length === 0).map(([, rule]) => rule),
    { ...draft, id: ruleId ?? 'preview-draft', revision: existing?.revision ?? 1, enabled: existing?.enabled ?? true }]
  const checked = eligible.filter(tx => records[tx.importRecordId!].exclusionOverride !== 'include')
  const matchingCount = checked.filter(tx => evaluateExclusionRules(nextRules, records[tx.importRecordId!].original, records[tx.importRecordId!].sourceId).length > 0).length
  const unavailableRecords = Object.values(records).filter(record => record.decision !== 'duplicate' && !sources[record.sourceId]).length
  const save = () => {
    if (errors.length) return
    const offer = captureTriageUndo({ ruleIds: ruleId ? [ruleId] : [], pendingIds: applyPending ? eligible.map(tx => tx.id) : [], recordIds: applyPending ? eligible.map(tx => tx.importRecordId!) : [] })
    try {
      const id = useTriageStore.getState().saveExclusionRule(draft, {id:ruleId,applyPending})
      offer('Save exclusion rule', ruleId ? [] : [id]); onClose()
    } catch (error) { setSaveError(error instanceof Error ? error.message : 'Unable to save rule') }
  }
  const select = (label: string, value: string, onChange: (value: string) => void, options: {value:string;label:string}[]) => <div role="group" aria-label={label} aria-describedby="exclusion-errors" className="flex flex-col gap-1"><span className="text-[13px] text-text-secondary">{label}</span><ThemedSelect ariaLabel={label} value={value} onChange={onChange} options={options} className="min-h-11" /></div>
  return <Sheet open={open} onClose={onClose} title="Exclusion Rule" ariaLabel="Exclusion Rule" panelClassName="max-w-xl" contentClassName="flex flex-col gap-4 p-4">
    <h2 className="hidden desktop:block text-[18px] font-semibold">Exclusion Rule</h2>
    <p className="text-[14px] text-text-secondary">Keep matching imports out of income and spending totals. You can review or restore them.</p>
    {existing && validateExclusionDraft(existing,sources).length > 0 && <p role="alert">Needs correction. Choose valid criteria before saving.</p>}
    <label className="text-[14px] flex flex-col gap-1">Rule name<input className={inputClass} value={name} onChange={e=>setName(e.target.value)} aria-describedby="exclusion-errors" /></label>
    {select('Card or account',scope,setScope,[{value:'',label:'Choose a card or account'},{value:'all',label:'All cards/accounts'},...Object.values(sources).map(s=>({value:s.id,label:s.name}))])}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {select('Description match',operator,v=>setOperator(v as typeof operator),[{value:'exact',label:'Exactly matches'},{value:'contains',label:'Contains'},{value:'starts-with',label:'Starts with'}])}
      {select('Money direction',direction,v=>setDirection(v as typeof direction),[{value:'in',label:'Money in'},{value:'out',label:'Money out'},{value:'either',label:'Either'}])}
    </div>
    <label className="text-[14px] flex flex-col gap-1">Original bank description<input className={inputClass} value={text} onChange={e=>setText(e.target.value)} aria-describedby="exclusion-errors" /></label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {select('Amount match',amountOperator,v=>setAmountOperator(v as typeof amountOperator),[{value:'any',label:'Any amount'},{value:'exact',label:'Exact amount'},{value:'between',label:'Between amounts'}])}
      {select('Behavior',behavior,v=>setBehavior(v as typeof behavior),[{value:'review',label:'Review matches'},{value:'automatic',label:'Automatically exclude'}])}
    </div>
    {amountOperator !== 'any' && <label className="text-[14px] flex flex-col gap-1">{amountOperator === 'exact' ? 'Amount' : 'Minimum amount'}<input className={inputClass} inputMode="decimal" value={amountText} onChange={e=>setAmountText(e.target.value)} aria-describedby="exclusion-errors" /></label>}
    {amountOperator === 'between' && <label className="text-[14px] flex flex-col gap-1">Maximum amount<input className={inputClass} inputMode="decimal" value={maxAmountText} onChange={e=>setMaxAmountText(e.target.value)} aria-describedby="exclusion-errors" /></label>}
    <div id="exclusion-errors">{[...errors, ...(saveError ? [saveError] : [])].map(error=><p key={error} role="alert" className="text-[13px] text-error">{error}</p>)}</div>
    <p className="text-[13px] text-text-secondary">{behavior === 'automatic' ? 'Matching new imports will be excluded automatically and kept in Excluded imports. Possible duplicates still need review.' : 'Matches will wait for your decision and stay out of Accept All.'}</p>
    <ExclusionRulePreview preview={preview} criteriaKey={JSON.stringify(draft) + amountText + maxAmountText} />
    {unavailableRecords > 0 && <p className="text-[13px] text-text-secondary">{unavailableRecords} saved imports have unavailable source information and are outside this preview.</p>}
    <label className="flex items-start gap-2 text-[14px]"><input type="checkbox" checked={applyPending} onChange={e=>setApplyPending(e.target.checked)} />Apply current rules to transactions awaiting review</label>
    {applyPending && <p className="text-[13px] text-text-secondary">All current enabled rules, including this draft if active, will be reapplied to {checked.length} transactions awaiting review. {matchingCount} pending imports match the next enabled rule set. Existing holds may be cleared. Included overrides stay included.</p>}
    <p className="text-[13px] text-text-secondary">Already accepted transactions will stay unchanged.</p>
    <div className="flex flex-wrap justify-end gap-2"><button type="button" className="min-h-11 px-3" onClick={onClose}>Cancel</button><button type="button" className="min-h-11 px-3 rounded-md bg-accent text-bg-primary disabled:opacity-50" disabled={errors.length>0} onClick={save}>Save Rule</button></div>
  </Sheet>
}



