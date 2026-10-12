import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from './storageKeys'
import type { TriageTransaction } from '../types/triage';
import { useBudgetStore } from './useBudgetStore';
import { v4 as uuidv4 } from 'uuid';
import { matchImport } from '../utils/budget/importHistory';
import type { ImportDay, ImportRecord, ImportReport, ImportSource } from '../types/importHistory';
import { useUndoStore } from './useUndoStore';
import type { ExclusionRule, ExclusionRuleDraft } from '../types/exclusionRules';
import { validateExclusionDraft } from '../utils/budget/exclusionRules';
import { applyImportExclusions } from '../utils/budget/applyImportExclusions';

interface TriageState {
  pendingTransactions: Record<string, TriageTransaction>;
  categoryRules: Record<string, string>;
  exclusionRules: Record<string, ExclusionRule>;
  importSources: Record<string, ImportSource>;
  importRecords: Record<string, ImportRecord>;
  importDays: ImportDay[];
  lastImport: ImportReport | null;
  saveExclusionRule: (draft: ExclusionRuleDraft, options?: { id?: string; applyPending?: boolean }) => string;
  setExclusionRuleEnabled: (id: string, enabled: boolean) => void;
  deleteExclusionRule: (id: string) => void;
  applyExclusionRulesToPending: () => string[];
  includeExclusionMatch: (id: string) => void;
  excludeExclusionMatches: (ids: string[]) => string[];
  createImportSource: (name: string, bankKey?: string) => string;
  bindImportSource: (sourceId: string, bankKey: string) => void;
  importTransactions: (rows: TriageTransaction[], sourceId: string) => ImportReport;
  restoreImportRecord: (id: string) => void;
  resolveDuplicate: (id: string) => void;
  
  addPending: (transactions: TriageTransaction[]) => void;
  updatePending: (id: string, updates: Partial<TriageTransaction>) => void;
  approveTransaction: (id: string) => void;
  /** Approves every row that is neither flagged as a duplicate nor held back by
   *  a flag. Returns the ids it approved, so the caller can offer to undo the
   *  batch. */
  approveAll: () => string[];
  rejectDuplicates: () => void;
  /** Clears every row flagged as not real income or spending, such as a credit
   *  card bill payment. */
  rejectCardPayments: () => void;
  rejectTransaction: (id: string) => void;
  clearAll: () => void;
  learnRule: (description: string, categoryId: string) => void;
  removeRule: (description: string) => void;
}

function validRules(state: Pick<TriageState, 'exclusionRules' | 'importSources'>) {
  return Object.entries(state.exclusionRules).filter(([id, rule]) =>
    rule?.id === id && rule.enabled === true && Number.isSafeInteger(rule.revision) && rule.revision >= 1 &&
    validateExclusionDraft(rule, state.importSources).length === 0).map(([, rule]) => rule);
}

function applyPendingRules(state: TriageState, exclusionRules = state.exclusionRules) {
  const eligible = Object.values(state.pendingTransactions).filter(tx => {
    const record = tx.importRecordId && state.importRecords[tx.importRecordId];
    return record && record.decision === 'pending' && !!state.importSources[record.sourceId];
  });
  const result = applyImportExclusions(eligible, state.importRecords, validRules({ ...state, exclusionRules }));
  const pendingTransactions = { ...state.pendingTransactions };
  for (const tx of eligible) delete pendingTransactions[tx.id];
  for (const tx of result.pending) pendingTransactions[tx.id] = tx;
  return { pendingTransactions, importRecords: result.records, excludedIds: result.excludedIds };
}

export function migrateTriageState(persisted: unknown, version: number) {
  const state = (persisted ?? {}) as Partial<TriageState>;
  return { ...state,
    ...(version < 2 ? { importSources: {}, importRecords: {}, importDays: [], lastImport: null } : {}),
    exclusionRules: state.exclusionRules ?? {},
  };
}

export const useTriageStore = create<TriageState>()(
  persist(
    (set, get) => ({
      pendingTransactions: {},
      categoryRules: {},
      exclusionRules: {},
      importSources: {},
      importRecords: {},
      importDays: [],
      lastImport: null,

      saveExclusionRule: (draft, options = {}) => {
        const state = get();
        const errors = validateExclusionDraft(draft, state.importSources);
        if (errors.length) throw new Error(errors[0]);
        const previous = options.id ? state.exclusionRules[options.id] : undefined;
        if (options.id && !previous) throw new Error('Choose an available exclusion rule');
        const revision = previous ? previous.revision + 1 : 1;
        if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('Choose a valid rule revision');
        const id = options.id ?? uuidv4();
        const rule: ExclusionRule = { ...draft, name: draft.name.trim(),
          description: { ...draft.description }, amount: { ...draft.amount },
          id, revision, enabled: previous?.enabled ?? true };
        const exclusionRules = { ...state.exclusionRules, [id]: rule };
        const applied = options.applyPending ? applyPendingRules(state, exclusionRules) : undefined;
        useUndoStore.getState().dismissUndo();
        set({ exclusionRules, ...(applied ? { pendingTransactions: applied.pendingTransactions, importRecords: applied.importRecords } : {}) });
        return id;
      },

      setExclusionRuleEnabled: (id, enabled) => {
        const state = get(), rule = state.exclusionRules[id];
        if (!rule) return;
        if (enabled && (rule.id !== id || !Number.isSafeInteger(rule.revision) || rule.revision < 1 ||
          validateExclusionDraft(rule, state.importSources).length)) throw new Error('Choose a valid exclusion rule');
        useUndoStore.getState().dismissUndo();
        set({ exclusionRules: { ...state.exclusionRules, [id]: { ...rule, enabled } } });
      },

      deleteExclusionRule: (id) => {
        if (!get().exclusionRules[id]) return;
        useUndoStore.getState().dismissUndo();
        const exclusionRules = { ...get().exclusionRules };
        delete exclusionRules[id];
        set({ exclusionRules });
      },

      applyExclusionRulesToPending: () => {
        const applied = applyPendingRules(get());
        useUndoStore.getState().dismissUndo();
        set({ pendingTransactions: applied.pendingTransactions, importRecords: applied.importRecords });
        return applied.excludedIds;
      },

      includeExclusionMatch: (id) => {
        const state = get(), tx = state.pendingTransactions[id];
        const record = tx?.importRecordId ? state.importRecords[tx.importRecordId] : undefined;
        if (!tx || !record || !state.importSources[record.sourceId]) return;
        useUndoStore.getState().dismissUndo();
        set({ pendingTransactions: { ...state.pendingTransactions, [id]: { ...tx, exclusionMatches: undefined } },
          importRecords: { ...state.importRecords, [record.id]: { ...record, exclusionOverride: 'include', exclusionMatches: undefined } } });
      },

      excludeExclusionMatches: (ids) => {
        const state = get(), pendingTransactions = { ...state.pendingTransactions }, importRecords = { ...state.importRecords };
        const excludedIds: string[] = [];
        for (const id of new Set(ids)) {
          const tx = pendingTransactions[id], record = tx?.importRecordId ? importRecords[tx.importRecordId] : undefined;
          if (!tx?.exclusionMatches?.length || tx.duplicate || !record || record.decision !== 'pending') continue;
          delete pendingTransactions[id];
          importRecords[record.id] = { ...record, decision: 'ignored', ignoreReason: 'rule', exclusionMatches: tx.exclusionMatches };
          excludedIds.push(record.id);
        }
        useUndoStore.getState().dismissUndo();
        set({ pendingTransactions, importRecords });
        return excludedIds;
      },

      createImportSource: (name, bankKey) => {
        const existing = bankKey && Object.values(get().importSources).find(source => source.bankKey === bankKey);
        if (existing) return existing.id;
        if (!name.trim()) throw new Error('Enter a card or account name');
        const id = uuidv4();
        set(state => ({ importSources: { ...state.importSources, [id]: { id, name: name.trim(), bankKey } } }));
        return id;
      },

      bindImportSource: (sourceId, bankKey) => {
        const source = get().importSources[sourceId];
        if (!source || (source.bankKey && source.bankKey !== bankKey)) throw new Error('Choose the matching card or a new source');
        const conflict = Object.values(get().importSources).find(s => s.bankKey === bankKey && s.id !== sourceId);
        if (conflict) throw new Error('This card already has an import source');
        set(state => ({ importSources: { ...state.importSources, [sourceId]: { ...source, bankKey } } }));
      },

      importTransactions: (rows, sourceId) => {
        const state = get();
        if (!state.importSources[sourceId]) throw new Error('Choose a card or account');
        useUndoStore.getState().dismissUndo();
        const importedIds = new Set(Object.keys(state.importRecords));
        for (const record of Object.values(state.importRecords)) {
          if (record.matchedTransactionId) importedIds.add(record.matchedTransactionId);
        }
        const legacy = [
          ...Object.values(useBudgetStore.getState().transactions).filter(tx => !importedIds.has(tx.id)),
          ...Object.values(state.pendingTransactions).filter(tx => !tx.importRecordId),
        ];
        const result = matchImport(rows, sourceId, state.importRecords, state.importDays, legacy);
        const rules = validRules(state);
        const excluded = applyImportExclusions(result.pending, result.records, rules);
        const report = { ...result.report, excludedIds: excluded.excludedIds };
        set({
          pendingTransactions: { ...state.pendingTransactions, ...Object.fromEntries(excluded.pending.map(tx => [tx.id, tx])) },
          importRecords: excluded.records, importDays: result.days, lastImport: report,
        });
        return report;
      },

      restoreImportRecord: (id) => {
        const state = get(), record = state.importRecords[id];
        if (!record || record.decision !== 'ignored') return;
        useUndoStore.getState().dismissUndo();
        set({ pendingTransactions: { ...state.pendingTransactions,
          [id]: { ...record.original, id, importRecordId: id, importSourceId: record.sourceId, exclusionMatches: undefined,
            duplicate: record.matchedRecordId || record.matchedTransactionId ? 'possible' : undefined,
            duplicateRecordId: record.matchedRecordId, duplicateTransactionId: record.matchedTransactionId } },
          importRecords: { ...state.importRecords, [id]: { ...record, decision: 'pending',
            exclusionOverride: 'include', exclusionMatches: undefined, ignoreReason: undefined,
            matchedRecordId: undefined, matchedTransactionId: undefined } } });
      },

      resolveDuplicate: (id) => {
        const tx = get().pendingTransactions[id];
        if (!tx?.duplicate) return;
        useUndoStore.getState().dismissUndo();
        set(state => {
          const pendingTransactions = { ...state.pendingTransactions };
          delete pendingTransactions[id];
          const recordId = tx.importRecordId;
          const record = recordId && state.importRecords[recordId];
          return { pendingTransactions, importRecords: record ? { ...state.importRecords,
            [record.id]: { ...record, decision: 'duplicate', matchedRecordId: tx.duplicateRecordId, matchedTransactionId: tx.duplicateTransactionId },
          } : state.importRecords };
        });
      },

      learnRule: (description, categoryId) =>
        set((state) => ({
          categoryRules: { ...state.categoryRules, [description]: categoryId },
        })),

      removeRule: (description) =>
        set((state) => {
          const newRules = { ...state.categoryRules };
          delete newRules[description];
          return { categoryRules: newRules };
        }),

      addPending: (transactions) => {
        useUndoStore.getState().dismissUndo();
        set((state) => {
          const newPending = { ...state.pendingTransactions };
          const importRecords = { ...state.importRecords };
          transactions.forEach((tx) => {
            newPending[tx.id] = tx;
            if (tx.importRecordId && tx.importSourceId) {
              const previous = importRecords[tx.importRecordId];
              importRecords[tx.importRecordId] = { ...previous, id: tx.importRecordId, sourceId: tx.importSourceId,
                original: previous?.original ?? { ...tx }, decision: 'pending',
                matchedRecordId: undefined, matchedTransactionId: undefined };
            }
          });
          return { pendingTransactions: newPending, importRecords };
        });
      },

      updatePending: (id, updates) => {
        if (!get().pendingTransactions[id]) return;
        useUndoStore.getState().dismissUndo();
        set((state) => ({
          pendingTransactions: {
            ...state.pendingTransactions,
            [id]: { ...state.pendingTransactions[id], ...updates },
          },
        }));
      },

      approveTransaction: (id) => {
        const state = get();
        const tx = state.pendingTransactions[id];
        if (!tx || tx.exclusionMatches?.length) return;
        useUndoStore.getState().dismissUndo();
        
        // Push to main budget store
        useBudgetStore.getState().addTransaction({
          id: tx.id,
          date: tx.date,
          amount: tx.amount,
          categoryId: tx.categoryId || '',
          description: tx.description,
          type: tx.type,
        });

        // Learn the rule if a category is assigned
        if (tx.categoryId) {
          state.learnRule(tx.description, tx.categoryId);
        }

        // Remove from triage
        set((state) => {
          const newPending = { ...state.pendingTransactions };
          delete newPending[id];
          const record = tx.importRecordId && state.importRecords[tx.importRecordId];
          return { pendingTransactions: newPending, importRecords: record ? {
            ...state.importRecords, [record.id]: { ...record, decision: 'accepted' },
          } : state.importRecords };
        });
      },

      approveAll: () => {
        useUndoStore.getState().dismissUndo();
        const state = get();
        const budgetState = useBudgetStore.getState();
        const txs = Object.values(state.pendingTransactions).filter((tx) => !tx.duplicate && !tx.flag && !tx.exclusionMatches?.length);

        txs.forEach((tx) => {
          budgetState.addTransaction({
            id: tx.id,
            date: tx.date,
            amount: tx.amount,
            categoryId: tx.categoryId || '',
            description: tx.description,
            type: tx.type,
          });

          if (tx.categoryId) {
            state.learnRule(tx.description, tx.categoryId);
          }
        });

        const approvedIds = txs.map((tx) => tx.id);
        set((current) => {
          const newPending = { ...current.pendingTransactions };
          const importRecords = { ...current.importRecords };
          for (const id of approvedIds) delete newPending[id];
          for (const tx of txs) {
            const record = tx.importRecordId && importRecords[tx.importRecordId];
            if (record) importRecords[record.id] = { ...record, decision: 'accepted' };
          }
          return { pendingTransactions: newPending, importRecords };
        });
        return approvedIds;
      },

      rejectDuplicates: () => {
        for (const tx of Object.values(get().pendingTransactions).filter(tx => tx.duplicate)) get().resolveDuplicate(tx.id);
      },

      rejectCardPayments: () => {
        for (const tx of Object.values(get().pendingTransactions).filter(tx => tx.flag === 'card-payment')) get().rejectTransaction(tx.id);
      },

      rejectTransaction: (id) => {
        useUndoStore.getState().dismissUndo();
        set((state) => {
          const newPending = { ...state.pendingTransactions };
          const tx = newPending[id];
          delete newPending[id];
          const record = tx?.importRecordId && state.importRecords[tx.importRecordId];
          return { pendingTransactions: newPending, importRecords: record ? {
            ...state.importRecords, [record.id]: { ...record, decision: 'ignored',
              exclusionMatches: tx.exclusionMatches,
              matchedRecordId: tx.duplicateRecordId, matchedTransactionId: tx.duplicateTransactionId,
              ignoreReason: tx.exclusionMatches?.length ? 'rule' : tx.flag === 'card-payment' ? 'card-payment' : 'manual' },
          } : state.importRecords };
        });
      },

      clearAll: () => {
        useUndoStore.getState().dismissUndo();
        set(state => {
        const cancelled = new Set(Object.values(state.pendingTransactions).map(tx => tx.importRecordId).filter(Boolean));
        const cancelledTransactions = new Set(Object.keys(state.pendingTransactions));
        // Duplicate decisions are only meaningful while their original survives.
        // Invalidate dependent decisions too, including a chain of matches.
        let changed = true;
        while (changed) {
          changed = false;
          for (const record of Object.values(state.importRecords)) {
            if (!cancelled.has(record.id) && record.decision === 'duplicate' &&
              ((record.matchedRecordId && cancelled.has(record.matchedRecordId)) ||
                (record.matchedTransactionId && cancelledTransactions.has(record.matchedTransactionId)))) {
              cancelled.add(record.id);
              changed = true;
            }
          }
        }
        return { pendingTransactions: {},
          importRecords: Object.fromEntries(Object.entries(state.importRecords).filter(([id]) => !cancelled.has(id))),
          importDays: state.importDays.filter(day => day.recordIds.every(id => !cancelled.has(id))),
          lastImport: null,
        };
        });
      },
    }),
    {
      name: STORAGE_KEYS.triage,
      version: 3,
      migrate: migrateTriageState,
      merge: (persisted, current) => {
        const state = { ...current, ...(persisted as Partial<TriageState>) };
        state.exclusionRules = Object.fromEntries(Object.entries(state.exclusionRules ?? {}).map(([id, rule]) => {
          const valid = rule && typeof rule === 'object' && rule.id === id &&
            Number.isSafeInteger(rule.revision) && rule.revision >= 1 && typeof rule.enabled === 'boolean' &&
            validateExclusionDraft(rule, state.importSources).length === 0;
          return [id, valid ? rule : { ...rule, enabled: false }];
        }));
        return state;
      },
    }
  )
);
