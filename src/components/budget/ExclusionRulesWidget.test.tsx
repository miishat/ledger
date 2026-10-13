import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, it, expect } from 'vitest'
import { ExclusionRulesWidget } from './ExclusionRulesWidget'
import { useTriageStore } from '../../store/useTriageStore'
import { useUndoStore } from '../../store/useUndoStore'
const initial=useTriageStore.getState()
beforeEach(()=>{useTriageStore.setState(initial,true);useUndoStore.getState().dismissUndo()})
afterEach(cleanup)
it('shows empty state and opens a blank editor',()=>{render(<ExclusionRulesWidget/>);expect(screen.getByText('No exclusion rules yet')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Add exclusion rule'}));expect(screen.getByLabelText('Rule Name')).toHaveValue('')})
it('pauses, confirms deletion and offers scoped Undo',()=>{
 useTriageStore.setState({importSources:{a:{id:'a',name:'Card A'}},exclusionRules:{r:{id:'r',revision:1,enabled:true,name:'Payments',sourceId:'a',description:{operator:'exact',value:'PAYMENT'},direction:'in',amount:{operator:'any'},behavior:'review'}}})
 render(<ExclusionRulesWidget/>);fireEvent.click(screen.getByRole('button',{name:'Pause Payments'}));expect(screen.getByText('Paused')).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'Delete Payments'}));expect(screen.getByText(/Deleting this rule stops future matches/)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'Delete Rule'}));expect(useTriageStore.getState().exclusionRules.r).toBeUndefined()
 useUndoStore.getState().runUndo();expect(useTriageStore.getState().exclusionRules.r.enabled).toBe(false)
})
it('renders malformed paused rules with correction state',()=>{
 useTriageStore.setState({exclusionRules:{r:{id:'r',revision:1,enabled:false,name:'Broken',description:null} as never}})
 render(<ExclusionRulesWidget/>);expect(screen.getByText('Needs correction')).toBeInTheDocument();expect(screen.getByRole('button',{name:'Resume Broken'})).toBeDisabled()
 fireEvent.click(screen.getByRole('button',{name:'Edit Broken'}));expect(screen.getByRole('button',{name:'Save Rule'})).toBeDisabled()
})
it('retains previous exclusion reason snapshots on pause and edit alone',()=>{
 const original={id:'a',date:'2026-06-10',description:'PAYMENT',amount:50,type:'income' as const}
 const matches=[{ruleId:'r',revision:1,name:'Payments',behavior:'review' as const}]
 const record={id:'a',sourceId:'a',decision:'pending' as const,original,exclusionMatches:matches}
 const pending={...original,importRecordId:'a',exclusionMatches:matches}
 useTriageStore.setState({pendingTransactions:{a:pending},importRecords:{a:record},importSources:{a:{id:'a',name:'Card A'}},exclusionRules:{r:{id:'r',revision:1,enabled:true,name:'Payments',sourceId:'a',description:{operator:'exact',value:'PAYMENT'},direction:'in',amount:{operator:'any'},behavior:'review'}}})
 render(<ExclusionRulesWidget/>);fireEvent.click(screen.getByRole('button',{name:'Pause Payments'}))
 fireEvent.click(screen.getByRole('button',{name:'Edit Payments'}))
 fireEvent.change(screen.getByLabelText('Original Bank Description'),{target:{value:'OTHER'}})
 fireEvent.click(screen.getByRole('button',{name:'Save Rule'}))
 expect(useTriageStore.getState().importRecords.a).toEqual(record)
 expect(useTriageStore.getState().pendingTransactions.a).toEqual(pending)
 expect(useTriageStore.getState().exclusionRules.r.enabled).toBe(false)
})
