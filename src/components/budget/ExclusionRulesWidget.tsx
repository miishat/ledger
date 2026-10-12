import { useState } from 'react'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ExclusionRuleSheet } from './ExclusionRuleSheet'
import { useTriageStore } from '../../store/useTriageStore'
import { validateExclusionDraft } from '../../utils/budget/exclusionRules'
import { captureTriageUndo } from '../../utils/budget/triageUndo'
import { formatMoney } from '../planner/format'

export function ExclusionRulesWidget() {
  const rules = useTriageStore(s=>s.exclusionRules), sources = useTriageStore(s=>s.importSources)
  const [editor, setEditor] = useState<{ruleId?:string} | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const lifecycle = (id: string, action: 'toggle' | 'delete') => {
    const offer = captureTriageUndo({ruleIds:[id]})
    try {
      if (action === 'delete') useTriageStore.getState().deleteExclusionRule(id)
      else useTriageStore.getState().setExclusionRuleEnabled(id,!rules[id].enabled)
      offer(action === 'delete' ? 'Delete exclusion rule' : 'Change exclusion rule status')
      setDeleting(null); setError('')
    } catch (e) {setError(e instanceof Error ? e.message : 'Unable to update rule')}
  }
  return <WidgetWrapper title={`Exclusion Rules (${Object.keys(rules).length})`}>
    <div className="flex flex-col gap-3 mt-2">
      <p className="text-[13px] text-text-secondary">Keep matching imports out of income and spending totals.</p>
      <button type="button" className="min-h-11 px-3 rounded-md border border-border self-start text-[14px]" onClick={()=>setEditor({})} aria-label="Add exclusion rule">Add Rule</button>
      {error && <p role="alert" className="text-error">{error}</p>}
      {Object.keys(rules).length === 0 && <p className="text-[13px] text-text-secondary">No exclusion rules yet</p>}
      <div className="divide-y divide-border">
        {Object.entries(rules).map(([id,rule])=>{
          const invalid = !rule || rule.id!==id || !Number.isSafeInteger(rule.revision) || rule.revision<1 || validateExclusionDraft(rule,sources).length>0
          const name = typeof rule?.name === 'string' ? rule.name : 'Invalid rule'
          const amount = rule?.amount
          const condition = invalid ? 'Needs correction' : `${rule.description.operator === 'exact' ? 'Exactly matches' : rule.description.operator === 'contains' ? 'Contains' : 'Starts with'}: ${rule.description.value} · ${rule.direction === 'in' ? 'Money in' : rule.direction === 'out' ? 'Money out' : 'Either direction'} · ${amount.operator === 'any' ? 'Any amount' : amount.operator === 'exact' ? formatMoney(amount.cents / 100) : `${formatMoney(amount.minCents / 100)} to ${formatMoney(amount.maxCents / 100)}`}`
          return <div key={id} className="py-3 flex flex-col gap-1">
            <p className="font-medium text-[14px] break-words">{name}</p>
            <p className="text-[13px] text-text-secondary">{rule?.sourceId === null ? 'All cards/accounts' : sources[rule?.sourceId]?.name ?? 'Source unavailable'}</p>
            <p className="text-[13px] break-words">{condition}</p>
            <p className="text-[13px]">{rule?.behavior === 'automatic' ? 'Automatic' : rule?.behavior === 'review' ? 'Review' : 'Behavior unavailable'} · <span>{rule?.enabled === true ? 'Active' : 'Paused'}</span></p>
            <div className="flex flex-wrap gap-2 text-[13px]">
              <button type="button" className="min-h-11 px-3 rounded-md border border-border" aria-label={`Edit ${name}`} onClick={()=>setEditor({ruleId:id})}>Edit</button>
              <button type="button" className="min-h-11 px-3 rounded-md border border-border disabled:opacity-50" aria-label={`${rule?.enabled ? 'Pause' : 'Resume'} ${name}`} disabled={!rule?.enabled && invalid} onClick={()=>lifecycle(id,'toggle')}>{rule?.enabled ? 'Pause' : 'Resume'}</button>
              <button type="button" className="min-h-11 px-3 rounded-md border border-border text-error" aria-label={`Delete ${name}`} onClick={()=>setDeleting(id)}>Delete</button>
            </div>
          </div>
        })}
      </div>
    </div>
    {editor && <ExclusionRuleSheet open onClose={()=>setEditor(null)} ruleId={editor.ruleId} />}
    <ConfirmDialog open={deleting!==null} title="Delete Exclusion Rule" message="Deleting this rule stops future matches. Previous exclusions remain available to restore." confirmLabel="Delete Rule" tone="danger" onCancel={()=>setDeleting(null)} onConfirm={()=>deleting && lifecycle(deleting,'delete')} />
  </WidgetWrapper>
}
