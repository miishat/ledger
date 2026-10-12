import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from './storageKeys'
import type { TriageTransaction } from '../types/triage';
import { useBudgetStore } from './useBudgetStore';
import { v4 as uuidv4 } from 'uuid';
import { matchImport } from '../utils/budget/importHistory';
import type { ImportDay, ImportRecord, ImportReport, ImportSource } from '../types/importHistory';
import { useUndoStore } from './useUndoStore';
import type { ExclusionRule } from '../types/exclusionRules';
import { validateExclusionDraft } from '../utils/budget/exclusionRules';

interface TriageState {
  pendingTransactions: Record<string, TriageTransaction>;
  categoryRules: Record<string, string>;
  exclusionRules: Record<string, ExclusionRule>;
  importSources: Record<string, ImportSource>;
  importRecords: Record<string, ImportRecord>;
  importDays: ImportDay[];
  lastImport: ImportReport | null;
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
        set({
          pendingTransactions: { ...state.pendingTransactions, ...Object.fromEntries(result.pending.map(tx => [tx.id, tx])) },
          importRecords: result.records, importDays: result.days, lastImport: result.report,
        });
        return result.report;
      },

      restoreImportRecord: (id) => {
        const record = get().importRecords[id];
        if (!record || record.decision !== 'ignored') return;
        get().addPending([{ ...record.original, importRecordId: id, importSourceId: record.sourceId }]);
      },

      resolveDuplicate: (id) => {
        const tx = get().pendingTransactions[id];
        if (!tx?.duplicate) return;
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

      addPending: (transactions) =>
        set((state) => {
          const newPending = { ...state.pendingTransactions };
          const importRecords = { ...state.importRecords };
          transactions.forEach((tx) => {
            newPending[tx.id] = tx;
            if (tx.importRecordId && tx.importSourceId) {
              const previous = importRecords[tx.importRecordId];
              importRecords[tx.importRecordId] = { id: tx.importRecordId, sourceId: tx.importSourceId,
                original: previous?.original ?? { ...tx }, decision: 'pending' };
            }
          });
          return { pendingTransactions: newPending, importRecords };
        }),

      updatePending: (id, updates) =>
        set((state) => ({
          pendingTransactions: {
            ...state.pendingTransactions,
            [id]: { ...state.pendingTransactions[id], ...updates },
          },
        })),

      approveTransaction: (id) => {
        const state = get();
        const tx = state.pendingTransactions[id];
        if (!tx) return;
        
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
        const state = get();
        const budgetState = useBudgetStore.getState();
        const txs = Object.values(state.pendingTransactions).filter((tx) => !tx.duplicate && !tx.flag);

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

      rejectTransaction: (id) =>
        set((state) => {
          const newPending = { ...state.pendingTransactions };
          const tx = newPending[id];
          delete newPending[id];
          const record = tx?.importRecordId && state.importRecords[tx.importRecordId];
          return { pendingTransactions: newPending, importRecords: record ? {
            ...state.importRecords, [record.id]: { ...record, decision: 'ignored' },
          } : state.importRecords };
        }),

      clearAll: () => set(state => {
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
      }),
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
